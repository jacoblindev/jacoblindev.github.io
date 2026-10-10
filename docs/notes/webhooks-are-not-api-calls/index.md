---
title: Webhooks are not API calls
description: A webhook is a contract someone else wrote. Capture a real request before you verify it, parse only what you use, and expect it to change on someone else's schedule.
---

# Webhooks are not API calls

My verifier rejected the first real CYBERBIZ webhook I checked it against.

It wasn't forged. I was building a receiver that turns a shop's order events
into messages to the buyer. CYBERBIZ, a Taiwanese e-commerce platform, signs
every delivery with HMAC-SHA256, twice: once over the request, and once over
the base64 of the shop's domain. My code computed both and compared them as
base64 strings, because the notes we worked from showed a base64 example.

So we asked the merchant to trigger an order event from a test account, with
the webhook pointed at a request-capture URL, and read what actually arrived.
Both signature headers were there. Both were hex.

Same key, same bytes, same hash. The only difference was how the result was
written down, and that was enough to reject every request. The fix was a few
lines: accept hex.

CYBERBIZ's [public guide](https://cyberbiz.notion.site/7f288c3a58e343f689372c3365897bf9) does say hex. It also says the signature covers "data
sent in the request" without saying which bytes that means. The docs could
have told me the encoding. They could not tell me what was signed. One
captured request answered both.

That is the whole post in one bug. A webhook looks like an API call: HTTPS,
JSON, a few headers. But you are on the receiving end, so someone else wrote
the contract, and the only part of it you can read is the docs. The rest is
whatever their code sends. So build against what actually arrives: capture
it before you verify it, parse only what you use, and expect it to change on
someone else's schedule.

## What a webhook is

The pattern got its name in a [2007 blog post by Jeff Lindsay](http://web.archive.org/web/20180928201955/http://progrium.com:80/blog/2007/05/03/web-hooks-to-revolutionize-the-web/): "user defined
callbacks made with HTTP POST." You give a platform a URL and choose the
events you care about. When one happens, the platform sends a POST to that
URL with the event in the body.

The alternative is polling: ask the platform's API every few minutes whether
anything has changed. Most of the time nothing has. [Zapier reported](http://web.archive.org/web/20230206231941/http://resthooks.org/) that
98.5% of its polls came back with nothing to act on. A webhook removes both
the waste and the wait. You hear about the order when it is placed, not on
the next poll.

It does not remove the poll, though. [Shopify says delivery](https://shopify.dev/docs/apps/build/webhooks) "isn't always
guaranteed" and tells you to "use reconciliation jobs to periodically fetch
data". So keep a poll, just a slow one: the webhook for speed, a
reconciliation job for completeness.

Mechanically, a webhook is an ordinary HTTP request. What changes is who the
client is. When you call an API, you decide when to call, which version to
ask for, how long to wait and whether to try again. When a platform calls
your webhook, it makes every one of those decisions for you:

- **How long you have.** [LINE waits 2 seconds](https://developers.line.biz/en/docs/messaging-api/check-webhook-error-statistics/). [Shopify gives you one second](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries)
  to connect and five for the whole request.
- **What counts as success.** [Shopify](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries): "Any response outside the 200 range,
  including 3XX codes, is treated as an error."
- **Whether it retries, and for how long.** [Shopify retries up to 8 times](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries)
  over 4 hours, [WhatsApp for up to 7 days](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview), and [GitHub not at all](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/troubleshooting-webhooks).
- **Order and duplicates.** [Shopify](https://shopify.dev/docs/apps/build/webhooks), [Stripe](https://docs.stripe.com/webhooks), [LINE](https://developers.line.biz/en/docs/messaging-api/receiving-messages/) and [SHOPLINE](https://open-api.docs.shoplineapp.com/docs/implementation-best-practices) all say events
  can arrive out of order and more than once.
- **Which version of the payload you get.** When your pinned API version
  expires, Shopify ["falls forward to using the next supported stable
  version"](https://shopify.dev/docs/api/admin-rest/usage/versioning).

Timeouts, retries and duplicates are a subject of their own. This post is
about what comes before all of them: knowing what the
request actually is. That starts with a decision the list leaves out: how
the platform proves a request came from it.

## Every platform signs differently

A platform proves who it is in two places. The **handshake** happens once,
when you register the URL: the platform checks that something answers there,
and sometimes that it knows a value you both agreed on. The **signature**
comes with every request: an HMAC of the request, keyed with a secret only
you and the platform hold, so you can tell their requests from anyone
else's, and tell whether the request was changed on the way.

The handshake proves nothing about the requests that come after it. [WhatsApp
checks your verify token once](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint), on a GET at registration; the POSTs that
follow carry only the signature. The signature is the check that matters.

Here is how four platforms do it, two e-commerce platforms and two
messaging channels:

| Platform | Handshake | Signature header | Encoding | What is signed |
|---|---|---|---|---|
| [Shopify](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries) | none | `X-Shopify-Hmac-Sha256` | base64 | the raw body |
| [CYBERBIZ](https://cyberbiz.notion.site/7f288c3a58e343f689372c3365897bf9) | none documented | `X-CYBERBIZ-HMAC-SHA256`, plus a second one over the shop's domain | hex | "data sent in the request" |
| [LINE](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/) | a signed POST with no events, when you press Verify | `x-line-signature` | base64 | the raw body |
| [WhatsApp](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/create-webhook-endpoint) | a GET: check `hub.verify_token`, echo `hub.challenge` | `X-Hub-Signature-256`, prefixed `sha256=` | hex, shown but never stated | the payload |

All four use HMAC-SHA256 and agree on almost nothing else. The [Standard
Webhooks project](https://github.com/standard-webhooks/standard-webhooks), a spec from Zapier, Twilio, Svix and others, exists
because of this: "the ecosystem is fragmented… Even high quality
implementations vary, making them inherently incompatible."

The verifier itself is a few lines:

```go
func verify(secret, body []byte, got string) bool {
	mac := hmac.New(sha256.New, secret)
	mac.Write(body) // the bytes as received, before any json.Unmarshal
	want := hex.EncodeToString(mac.Sum(nil)) // or base64: the docs may not say
	return hmac.Equal([]byte(want), []byte(got)) // constant-time, never ==
}
```

That proves who sent the request and that nobody changed it. It does not
prove the request is new. None of the four platforms above signs a
timestamp, so a request someone copied, out of a log or a capture URL,
verifies just as well the second time. Platforms that do sign one, such as
[Stripe](https://docs.stripe.com/webhooks/signature) and [Slack](https://docs.slack.dev/authentication/verifying-requests-from-slack), let you reject anything too old. With these four, the
only defence is remembering which events you have already handled. Check
whether your platform gives you a delivery ID to do that with; not all of
them document one. Deduplicating on it is a subject of its own.

The hard part is not the code. It is knowing what goes into it, and that
is where the docs fall short, in three ways.

**What exactly is signed.** It has to be the bytes as they arrived. Parse
the JSON and serialise it again, and key order, whitespace and escaping
change. [LINE spells it out](https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/): "If any modification (string substitution,
deserialization, escaping, etc.) is made… signature verification will fail."
[Meta goes further](https://developers.facebook.com/docs/messenger-platform/webhooks): it signs "an escaped unicode version of the payload,
with lowercase hex digits. If you just calculate against the decoded bytes,
you will end up with a different signature." CYBERBIZ's "data sent in the
request" doesn't say which bytes. A framework that parses the body before
your handler sees it breaks all of them.

**How the result is written down.** Hex or base64, with or without a prefix.
The table splits two and two. SHOPLINE runs more than one webhook system,
each with its own scheme, and on one of them the [header example in the docs](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview)
is base64 while the [official Go sample](https://developer.shopline.com/docs/apps/api-instructions-for-use/generate-and-verify-signatures) compares hex.

**Docs you can't run.** Example payloads are illustrations, not fixtures.
Check one against a capture before you paste it into a test.

None of these shows up in a unit test written from the docs, because the
test inherits the same reading of them. They show up the first time a real
request arrives. So make that happen on purpose, before you write the
verifier.

## Capture before you verify

Capturing is simple. Point the webhook at a URL that records whatever it
receives, trigger a real event, and read the request: every header, and the
body byte for byte. Then save it. A captured request is the best test
fixture you will get, because nobody wrote it from the docs.

Two choices decide whether that is safe and whether it is worth anything.

**Where the event comes from.** A capture tool sees everything the platform
sends, and an order event carries a buyer's name, phone number and address.
So trigger it from a test account, as we did with CYBERBIZ. Nothing real
leaves the platform, and the request is still a real one: real headers, real
signature, real bytes.

**What sends it.** A vendor's own test tool is not always a capture. Some
forward real events: [the Stripe CLI](https://docs.stripe.com/cli/listen) and [`gh webhook forward`](https://docs.github.com/en/webhooks/testing-and-troubleshooting-webhooks/using-the-github-cli-to-forward-webhooks-for-testing) relay events
from a sandbox or a test repository. [Shopify's CLI trigger](https://shopify.dev/docs/api/shopify-cli/app/app-webhook-trigger) does something
else. It sends "a sample Admin API event topic payload" that will "always
have the same payload", and the docs say plainly: "You can't use this method
to validate your API webhook subscriptions." It shows you what the docs
already say. To see what Shopify actually sends, its docs say to "always
trigger webhooks by performing the related action in Shopify".

### Where to capture, and what it costs

| Option | Data stays with you | Public HTTPS URL | What you take on |
|---|---|---|---|
| Free hosted capture URL (e.g. webhook.site) | no | given | nothing |
| Paid hosted capture | no, but login-protected | given | a paid plan |
| Self-hosted capture tool behind a tunnel | mostly | through the tunnel | running a tunnel |
| Self-hosted on a deployed host | yes | yours to set up | running a host with a certificate |

**The free hosted URL is readable by anyone who has it.** [webhook.site's
docs say so](https://docs.webhook.site/): on the free plan, "data is accessible to anyone who knows the
ID of the URL". The URL and its data are removed after 7 days. That is fine
for a test account's order and wrong for anything real. Paid plans put the
requests behind a login, but they still sit on someone else's servers.

**Self-hosting moves the problem rather than removing it.** webhook.site is
[open source and runs in Docker](https://docs.webhook.site/open-source.html), so you can keep captures on your own
machine. But the platform has to reach it, and platforms deliver over HTTPS
only; [Shopify](https://shopify.dev/docs/apps/build/webhooks/verify-deliveries) and [CYBERBIZ both say so](https://cyberbiz.notion.site/006d6e58ca8d4cd6b03ffc32556bd1b0). So you need a tunnel, such as
[ngrok](https://ngrok.com/docs/agent/web-inspection-interface/), whose traffic crosses the tunnel provider's servers, or a host you
deploy with a real certificate. That setup is the price of keeping the
data.

**A test account shows you one request, on one day.** It tells you what this
platform sent for this event, now. It does not promise the next shop, the
next event type, or next month. That is what the rest of this post is for.

What I used was the first row with test-account data: no setup, and
nothing real exposed. If a platform cannot produce test events, the
self-hosted rows are worth their setup. The setup costs less than a stranger
reading your customers' orders.

## Parse what you use

The obvious move after a capture is to paste the payload into a generator
and get back a struct with every field in it. Don't. Every field you declare
is a field that can break your parser, and most of them you never read.

There are two old arguments here. [The Tolerant Reader pattern](https://martinfowler.com/bliki/TolerantReader.html), as Martin
Fowler wrote it up, says "only take the elements you need, ignore anything
you don't". [RFC 9413](https://www.rfc-editor.org/rfc/rfc9413), from 2023, pushes back on tolerance in general: "Tolerating unexpected input instead
conceals problems." Both are right, about different fields. The RFC's own
advice "depends on an ability to update and deploy implementations", and you
cannot update the platform. So split it:

- **Fields you don't use: ignore them.** Don't reject a payload because it
  has something new in it. [LINE says in writing](https://developers.line.biz/en/docs/messaging-api/development-guidelines/) that it may add properties
  to webhook events, change their order, and add new enum values, all
  "without advance notice", and asks receivers to keep working.
- **Fields you do use: be strict, and loud when they break.** If the order
  number stops being a number, you want to know today, not when a customer
  asks why their message never came.

In Go, the first half is the default. [`encoding/json` ignores keys](https://pkg.go.dev/encoding/json) your
struct does not declare, so a struct with only the fields you read is
already a tolerant reader:

```go
// Only what the handler reads. Everything else in the body is ignored.
type OrderEvent struct {
	OrderNumber int    `json:"order_number"`
	CreatedAt   string `json:"created_at"`
	Receiver    struct {
		Phone string `json:"phone"`
	} `json:"receiver"`
}
```

Leave `DisallowUnknownFields` off. One thing to watch: [`encoding/json/v2`](https://pkg.go.dev/encoding/json/v2),
used directly, is stricter than v1. It matches names case-sensitively and
rejects duplicate keys, so moving a receiver to it can start rejecting
payloads that used to parse.

### Strings that mean something else

The fields you do use are where the real trouble is, because so many of them
arrive as strings that mean something else. Take dates, from the public docs
alone: [CYBERBIZ documents creation times](https://cyberbiz.notion.site/033968ca7dba48c3bf969a827e6c867a) as `YYYY-MM-DD HH:MM+0800` on some
events and ISO 8601 on others. [WhatsApp sends epoch seconds as strings](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/text). No two
of these platforms document a phone number the same way. And some fields are
simply whatever the buyer typed into a form: the platform stores the text as
entered and passes it on, so the same field arrives formatted differently from
one order to the next.
If the platform doesn't normalise it, you have to.

So parse the field as the string it is, and normalise it in a separate step
with its own rules and its own errors. A Taiwan mobile number, for example,
can arrive as any of these (values invented):

```
0912-345-678
0912345678
+886 912 345 678
+886-0912-345-678
```

The last one is a country code glued onto the local number, leading zero
and all. Strip everything that is not a digit, accept the shapes you know,
turn each into one canonical form, and reject the rest with an error that
names the field.

### When it breaks

Two kinds of failure look alike and are not:

- **The payload doesn't parse.** A field you rely on changed type or
  disappeared. The contract changed. Log it at ERROR, with the field name
  and the event type, and never the value, which is someone's phone number.
- **The payload parses, but a value is unusable.** A landline where you
  need a mobile. The contract is fine; this order just isn't for you. A
  warning is enough.

In both cases, return 200. A non-2xx tells the platform to try again, and it
will resend the same bytes that failed the first time, for hours or days.
Some platforms then give up on you altogether: [SHOPLINE's developer platform](https://developer.shopline.com/docs/apps/api-instructions-for-use/webhooks/overview)
cancels a subscription after 19 failed retries in 48 hours. A bad signature
is different. That request may not be from the platform at all, so reject
it.

**What returning 200 costs.** The platform will never resend the event, so
the only thing standing between a changed field and a silently missing
message is somebody reading the logs. Log loudly, and watch the logs: put an
alert on that ERROR, not just a line in a file.

Then accept that the event is gone. You could store every raw request before
parsing it and replay the ones that failed once the parser is fixed. But an
order event is a buyer's name, phone number and address, and every copy you
keep is one more you have to protect, restrict and delete on time. Unless you
need replay, think twice before keeping it: the slow reconciliation poll from
earlier recovers what you dropped. If you do need replay, that is a reason to
put a queue in front of the processing, and a queue brings trade-offs of its
own.

## Change on someone else's schedule

The payload you captured is true on the day you captured it. It will change,
and the only question is whether anyone tells you first.

**Some platforms announce, on their own schedule.** Shopify versions its
API, and a stable version is ["Guaranteed not to change for its supported
lifetime"](https://shopify.dev/docs/api/usage/versioning). When that lifetime ends, Shopify ["falls forward to using the next
supported stable version"](https://shopify.dev/docs/api/admin-rest/usage/versioning), and your webhooks change shape whether or not you
were ready. Each delivery carries an [`X-Shopify-API-Version` header](https://shopify.dev/docs/apps/build/webhooks/delivery-structure) saying
which version produced it, which is worth logging. [Stripe ties the event
structure to your account's API version](https://docs.stripe.com/webhooks). [SHOPLINE keeps a "Breaking Changes"
page](https://open-api.docs.shoplineapp.com/docs/coming-soon). All of that is real notice, but you only get it if you watch for it,
and the date is never yours.

**Some say up front that they won't.** [LINE lists what it may change](https://developers.line.biz/en/docs/messaging-api/development-guidelines/)
"without advance notice": adding properties to webhook events, changing
their order, adding enum values, and "Whether or not to include spaces or
line breaks". Each one is harmless if you ignore fields you don't read and
verify the raw bytes rather than your own re-serialisation, so whitespace
can't break the signature. Skip either, and a change LINE calls non-breaking
breaks you.

**Some keep no public record.** CYBERBIZ has no changelog, and [one field in
its docs](https://cyberbiz.notion.site/033968ca7dba48c3bf969a827e6c867a) is marked "(Deprecated. Will be removed soon)" with no removal
date. Without a record, your own logs are the changelog: one more reason to
log loudly when a field you use breaks.

### When there is nothing to capture yet

[In April 2026 Meta began sending](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-scoped-user-ids) a new identifier for WhatsApp users, the
business-scoped user ID, to support usernames. A user who adopts a username
may arrive without their phone number. For a receiver that keys everything
on the phone number, a field it relied on can simply stop arriving.

[Meta is blunt about it](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-scoped-user-ids): "Because you cannot control whether your users
adopt usernames, you must support BSUID to avoid losing the ability to
process their messages." It is less exact about when. Usernames roll out
"gradually in 2026", and "Any changes described in this document are
subject to change." In one region we serve, the date has been postponed
twice and now points at November, still unconfirmed. You can't be ready by
a date that doesn't exist, only ready for the change to land any day.
That is the one case where the advice in this post can't be followed: you
can't capture a request the platform isn't sending you yet, and waiting
until it does means finding out in production.

So the order flips. Build from the docs, and write the test cases by hand
from the documented shape, including the one where the phone number is
missing. Ship that before the change lands. When the first real one arrives,
capture it and compare it against the cases you wrote. Ours matched, so
far.

That is still the same rule, just run backwards. The docs are a hint either
way; the captured request is what you check against. Sometimes you get the
capture first, and sometimes you have to wait for it.

## The contract is what arrives

A webhook looks like an API call and isn't one. When you call an API, you
are the client, and you can test its contract whenever you like. When a
platform calls you, it is the client, it wrote the contract, and the docs
are only the part of it you get to read. The rest arrives in a request.

So build against the request:

- **Capture a real one from a test account before you write the
  verifier.** The code and the notes behind it agreed on base64. One
  captured CYBERBIZ request disagreed, and it was right.
- **Parse what you use, and only that.** Ignore the rest. Be strict on the
  fields you read, and when one breaks, return 200, log it loudly, and put
  an alert on that log.
- **Expect change on someone else's schedule.** Log the version the payload
  claims, watch the changelog, and when a change is announced before you can
  capture it, write the test cases from the docs and check them against the
  first real request.

Everything here happens before you process an event. What happens after,
whether to do the work inside the request or hand it to a queue, and why the
answer depends on the work one event triggers, is a separate question, and
the one [Webhooks: sync or queue](/notes/webhooks-sync-or-queue/) takes up.
