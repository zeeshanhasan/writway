

# Feature: Claim Questionair

## Overview
We will be building an interactive page where we will ask the user a set of question that once provided will make an API call to the OpenAI to validate the user input and generate two documents for legal claim in canada.

## Acceptance Criteria

* User will be on the public page called /claim
* User will be asked the following questions in sequence
* User should see the progress line 
* Answers can be input or selection based on the questions.
* At one time one question will be asked or mixed a few to keep it simple and clean process.
* Build a prototype only for now.

## Questions & Steps listed below

Step 1 – Eligibility Check
What is the total amount you are claiming (including any interest or costs)?
Is the amount $35,000 or less?
Is your claim based in Ontario (e.g., the transaction or event happened here or the Defendant is located here)?
When did the issue happen? (to check limitation period)
Is this about money owed, property returned, or damages for a loss?
If “No” to any, display: “Your case might not qualify for Ontario Small Claims Court. Would you like to learn about other options?”
Step 2 – Plaintiff Information
Please enter your full legal name.
Are you filing as an individual, business, or organization?
Your address for service (street, city, province, postal code).
Your phone number and email.
Do you have a representative (paralegal, lawyer, or agent)?
If yes → collect rep name, business name, address, and contact details.

Step 3 – Defendant Information
How many defendants are there?
For each defendant, please enter:
Full legal name
Type (individual / business / corporation)
Address for service
Phone / email (if known)
Do you know whether the defendant operates a registered business name different from their legal name?
Step 4 – Details of the Claim
Briefly describe what happened. (e.g., “The Defendant failed to pay for renovation work.”)
When did the issue start? (date)
Where did it happen? (address or city)
What agreement or understanding existed between you and the Defendant?
What did the Defendant do (or fail to do) that caused this claim?
Have you already asked the Defendant to resolve the issue?
If yes → What was their response?
Has the Defendant made any partial payments or offers?
(AI will later summarize this section into the “Statement of Claim.”)
Step 5 – Amount of Claim
What is the principal amount you are claiming?
Are you claiming interest?
If yes → What interest rate and from what date?
Are you claiming court filing costs or service fees?
If yes → specify estimated amount.
Are you claiming any additional damages (e.g., inconvenience, property damage, or lost income)?
AI should auto-calculate a total and display it back to the user for confirmation.
Step 6 – Remedy Requested
What are you asking the court to order the Defendant to do?
Pay money ☑️
Return property ☑️
Perform an obligation ☑️
Do you want interest and costs awarded as well?

Step 7 – Supporting Facts & Evidence
What documents support your claim? (e.g., invoices, contracts, emails, receipts)
Do you have any witnesses?
Would you like to upload or describe key pieces of evidence now?
Please provide a timeline of the main events, if possible.
Step 8 – Legal Issue Identification (Alexi Hook)
Using answers from above, the system sends structured data to Alexi AI for:
Identifying relevant legal issues (e.g., breach of contract, unpaid invoice, negligence).
Pulling relevant case law or legislation.
Returning optional plain-language legal context for the Plaintiff’s review.
Step 9 – Review & Generate
Display a summary preview of all data.
Ask user to confirm: “Is everything correct?”
Generate a draft Plaintiff’s Claim (Form 7A) in PDF + editable text.
Include a Statement of Claim paragraph drafted by AI based on their answers.
