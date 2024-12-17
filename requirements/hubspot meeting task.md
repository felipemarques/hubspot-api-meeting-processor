# HubSpot Meeting Task

You can copy the code from here:

[api-sample-test-master.zip](https://prod-files-secure.s3.us-west-2.amazonaws.com/866f550e-3155-4f41-aaa4-c43840e0a94d/737bb19b-8d62-4d2e-9d12-9b2cb3654f4b/api-sample-test-master.zip)

There is an engagement type called meeting in HubSpot. When a salesperson meets with a contact, they create a meeting through HubSpot for it.

1. Just like how we've done it for contacts and companies, write a method in the `worker.js` file that pulls and processes the meetings. Pull the meeting title and some timestamp properties from the meeting object. This worker will ideally run on a daily basis to get newly modified meetings.

2. You need to insert two actions as a result of this processing: `Meeting Created` (when that meeting record was created in HubSpot) and `Meeting Updated` (whenever it isn’t a Created action).

3. Store which contact attended the meeting along with the meeting properties. HubSpot normally doesn't give this data at the same time with the meetings so you should find another way to get it. At the end, you should have each meeting as a separate action along with the **email** of the contact which attended the meeting.

4. Write a short debrief (about 8-10 sentences is enough) on how you would improve this project in terms of (1) code quality and readability, (2) project architecture, and especially (3) code performance.

5. Send the code and the debrief to us through a new Github repo that you create.

Disclaimer: You'll primarily (but not only) work in the `worker.js` file. The code itself isn't very well written, but this is part of the test. The tradeoffs you make to deliver this feature tell us more about how you work in a fast-paced environment. Aim for around 2-3 hours of work.