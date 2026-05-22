# QSB Ask - User Requirements Specification

Version: 1.0  
Date: 22 May 2026  
Status: Approved

## 1. Purpose & Background

QSB Ask is a live question and survey tool for events, meetings, briefings, training sessions, and stakeholder engagements where organisers need a simple way to collect audience input while keeping public discussion controlled and professional.

The product is intended as a focused alternative to tools such as Slido, with live Q&A and form-style surveys as the main use cases. The priority is not to copy every feature, but to provide the features that matter most for controlled corporate and stakeholder settings.

The most important need is moderation. Organisers must be able to review incoming questions before they appear publicly, so inappropriate, duplicate, off-topic, confidential, or sensitive questions do not disrupt the session.

## 2. User Personas

### Event Organiser

The person who creates and manages an event. They need confidence that the audience can participate without creating reputational, governance, or operational risk.

### Moderator

The person who reviews incoming questions during a live session. They need a fast and clear way to approve, reject, organise, and mark questions as handled.

### Presenter or Speaker

The person answering questions during the event. They need to see approved and relevant questions without being distracted by unreviewed submissions.

### Audience Participant

The person attending the event. They need a simple way to submit questions, support questions from others, and respond to surveys without needing training or a complicated account setup.

### Administrator

The person responsible for oversight, access, and records. They need the product to support accountable use, reliable records, and appropriate control over events.

## 3. Jobs To Be Done

### Live Q&A

When an audience member has a question, they need to submit it quickly so that it can be considered during the session.

When a question is submitted, the organiser needs it to be reviewed before it becomes visible to the wider audience.

When many questions are submitted, the moderator needs to identify the most relevant, popular, recent, or already-handled questions.

When a speaker is ready to answer questions, they need to see only approved questions that are suitable for the session.

When a question has been addressed, the organiser needs to mark it as answered so the session can move forward clearly.

### Moderation

When a question is inappropriate, repeated, sensitive, or not relevant, the moderator needs to prevent it from appearing publicly.

When a question is acceptable, the moderator needs to approve it quickly so the audience and speaker can see it.

When a question needs minor correction, the moderator needs to improve the wording while preserving the intended meaning.

When a question is dismissed or no longer needed, the moderator needs to archive it without losing the record.

### Surveys

When the organiser needs audience feedback, they need to create a simple survey with one or more questions.

When participants answer a survey, they need the experience to be quick, clear, and mobile-friendly.

When a survey ends, the organiser needs to review and export the results for reporting or follow-up.

When survey responses are collected, the organiser needs to show the results visually during or after the session so that the audience and stakeholders can understand the feedback quickly.

### Event Participation

When participants join an event, they need a short code or link that works easily on mobile and desktop.

When participants take part, they should not need a complex login process unless the organiser requires identification.

## 4. Success Criteria

QSB Ask will be successful when:

- Organisers can run a live Q&A session with moderation enabled by default.
- No public question appears before it has been approved by a moderator.
- Moderators can review, approve, dismiss, edit, archive, and mark questions as answered without slowing down the session.
- Audience participants can submit questions and respond to surveys from a phone with minimal friction.
- Speakers can focus on approved questions instead of unfiltered audience submissions.
- Survey results can be reviewed and exported after the session.
- Survey results can be shown through clear charts or data views during or after the session.
- The product feels simple, controlled, and suitable for professional corporate use.
- Records of questions, survey responses, and moderation decisions are retained for accountability.

## 5. Constraints & Exclusions

### Constraints

- The product should prioritise controlled participation over entertainment-style engagement.
- Moderation should be treated as a core feature, not an optional premium feature.
- The audience experience should be simple enough for first-time users.
- The organiser experience should support live use under time pressure.
- The product should be suitable for internal corporate events and formal stakeholder engagements.
- The product should protect confidential, sensitive, or inappropriate submissions from being shown publicly.

### Exclusions For The First Version

- The first version does not need to include every Slido feature.
- The first version does not need quizzes, word clouds, idea boards, AI-generated polls, or complex gamification.
- The first version does not need advanced branding or event theming.
- The first version does not need complex analytics beyond clear survey charts, useful response counts, question status, and exportable results.
- The first version should not rely on automated moderation as the only safeguard.

## Review Questions

The following assumptions need confirmation before the PRD is created:

1. The primary audience is QSB internal users and invited event participants.
2. Questions should be anonymous by default, with optional identification for selected events.
3. Moderation should be enabled by default for every event.
4. Version 1 surveys should support multiple choice, multiple select, rating, and open text questions.
5. Version 1 should include chart and data views for survey results that can be shown during or after an event.
6. The product must never allow unapproved, inappropriate, confidential, or sensitive questions to appear publicly.
