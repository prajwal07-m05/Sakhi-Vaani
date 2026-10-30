# SAKHI VANI

### A Multilingual, Voice-First Agentic Healthcare Assistance Platform Connecting ASHA Workers and Rural Citizens

**Tagline:** *Every Voice Matters. Every Community Deserves Care.*

**Team:** NonChalant Coders\
**Team members:** Prajwal M · Preksha M · VM Vijaya Chinmayi · Sneha
Bansode\
**Theme:** Agentic AI & Multi-Agent Systems\
**Repository:** `prajwal07-m05/Sakhi-Vaani`

------------------------------------------------------------------------

## Table of Contents

-   [1. About the Project](#1-about-the-project)
-   [2. Problem Statement](#2-problem-statement)
-   [3. Our Solution](#3-our-solution)
-   [4. Application Modules](#4-application-modules)
-   [5. Assigned Hurdles and Implemented
    Solutions](#5-assigned-hurdles-and-implemented-solutions)
-   [6. Voice-Based ASHA Documentation
    Workflow](#6-voice-based-asha-documentation-workflow)
-   [7. Reports and Sharing](#7-reports-and-sharing)
-   [8. Offline Functionality](#8-offline-functionality)
-   [9. AI and Agent-Based
    Architecture](#9-ai-and-agent-based-architecture)
-   [10. High-Level System
    Architecture](#10-high-level-system-architecture)
-   [11. Privacy, Safety and Responsible
    Use](#11-privacy-safety-and-responsible-use)
-   [12. Technology Stack](#12-technology-stack)
-   [13. Main User Workflows](#13-main-user-workflows)
-   [14. Demonstration Scenarios](#14-demonstration-scenarios)
-   [15. Setup and Running the
    Project](#15-setup-and-running-the-project)
-   [16. Configuration](#16-configuration)
-   [17. Current Scope and
    Limitations](#17-current-scope-and-limitations)
-   [18. Future Enhancements](#18-future-enhancements)
-   [19. Team](#19-team)

------------------------------------------------------------------------

## 1. About the Project

SAKHI VANI is an integrated community healthcare assistance platform
designed to connect **ASHA (Accredited Social Health Activist) workers**
and **rural citizens** through accessible, multilingual and voice-first
digital workflows.

The platform brings two connected experiences into one system:

1.  **ASHA SAHAYAK** --- supports ASHA workers with household and
    beneficiary information, visit documentation, follow-up management
    and reporting.
2.  **CITIZEN & SAKHI CARE** --- provides citizens with accessible
    healthcare information and assistance for maternal, child, elderly
    and general healthcare needs.

SAKHI VANI aims to reduce avoidable documentation effort, improve the
organisation of beneficiary information, protect sensitive maternal
information on shared devices and make healthcare guidance easier to
access.

## 2. Problem Statement

Rural communities can face barriers when trying to access timely and
understandable healthcare information. These barriers may include:

-   Language differences and difficulty understanding health
    information.
-   Limited familiarity with complex digital interfaces.
-   Shared family smartphones and privacy concerns.
-   Fragmented beneficiary records and duplicate registrations.
-   Manual household surveys and visit documentation.
-   Difficulty tracking beneficiaries, appointments and follow-ups.
-   Healthcare myths and potentially harmful remedies shared through
    informal sources.
-   Communication gaps between citizens and frontline health workers.

ASHA workers play an important role in connecting communities with
healthcare services. Their work involves household visits, beneficiary
support, record maintenance and follow-up coordination. Digital tools
should support this work rather than create additional manual effort.

## 3. Our Solution

SAKHI VANI combines worker-facing workflows and citizen-facing
assistance in one platform.

### Key objectives

-   Make ASHA visit documentation easier through voice-based input and
    structured reports.
-   Organise household and beneficiary information.
-   Support follow-up and visit tracking.
-   Provide PIN-protected access to sensitive maternal information on
    shared phones.
-   Identify potential duplicate beneficiary records.
-   Help citizens ask questions about healthcare myths and receive
    relevant guidance.
-   Generate visit reports and support sharing through available
    channels.
-   Keep supported application workflows usable when offline, with
    synchronisation behaviour depending on the implemented feature and
    connection state.

## 4. Application Modules

### 4.1 ASHA SAHAYAK

ASHA SAHAYAK is the worker-facing module. It is designed to help ASHA
workers organise beneficiary-related work.

Capabilities in the project include:

-   Household and beneficiary management.
-   Beneficiary information for maternal, child, elderly and general
    categories.
-   Visit and survey documentation.
-   Voice-based visit input.
-   Conversion of visit information into structured documentation.
-   Review and editing before submission.
-   Follow-up and visit organisation.
-   Report generation.
-   PDF sharing through WhatsApp and email.
-   Potential duplicate beneficiary identification.

The purpose is to reduce repetitive typing and make records easier to
organise. The ASHA worker remains responsible for reviewing and
approving information before it becomes an official record.

### 4.2 CITIZEN & SAKHI CARE

CITIZEN & SAKHI CARE is the citizen-facing module. It is designed to
make healthcare assistance easier to access.

The application includes citizen-oriented healthcare support such as:

-   Maternal and motherhood-related assistance.
-   Child health information.
-   Elderly healthcare support.
-   General healthcare questions.
-   Healthcare myth-related questions through a dedicated chatbot.
-   Multilingual and voice-oriented interaction where supported by the
    application.
-   PIN-protected access to sensitive maternal information on shared
    devices.

The information provided by the platform is intended for education and
assistance. It does not replace diagnosis, treatment or advice from a
qualified healthcare professional.

## 5. Assigned Hurdles and Implemented Solutions

The assigned hurdle title was:

**Shared Phone, Duplicate Mothers, Harmful Myths**

The team integrated a solution for each challenge into the existing
SAKHI VANI application.

### 5.1 Hurdle 1 --- Shared Phone Privacy

**Problem:** In many households, one smartphone is shared by several
family members. A pregnant woman's sensitive health information should
not be revealed to whoever happens to use or pick up the phone.

**Implemented approach: PIN-based privacy protection**

-   PIN-based access is provided for protected maternal information.
-   A user must verify the PIN before accessing the protected area.
-   Access is provided for a configured temporary session.
-   The private session is intended to lock again after its configured
    duration.

**Expected outcome:** A shared device can support individual access to
protected maternal information without making those records openly
visible to every phone user.

**Important security requirement:** PIN protection should be enforced by
the application backend and data-access rules, not only by hiding
screens in the frontend. PINs must never be stored as plain text.
Sensitive notification previews and spoken responses should not expose
private information.

### 5.2 Hurdle 2 --- Duplicate Mothers

**Problem:** The same beneficiary may be registered more than once
because her name is entered with different spellings or scripts. For
example:

-   Lakshmi
-   Laxmi
-   ಲಕ್ಷ್ಮಿ

**Implemented approach: beneficiary duplicate detection**

-   The system checks a new beneficiary entry against existing
    beneficiary information.
-   It analyses name variations and other available beneficiary details.
-   It identifies potential matches to help prevent unnecessary
    duplicate registrations.

**Expected outcome:** ASHA workers can be alerted to possible duplicate
records and maintain more consistent beneficiary information.

**Important data-quality requirement:** Similar names alone must not
trigger an automatic merge. The system should show the possible match to
the ASHA worker for confirmation. Records should only be linked or
merged after confirmation, while preserving relevant history.
Cross-script matching should be tested with the languages supported by
the application.

### 5.3 Hurdle 3 --- Harmful Healthcare Myths

**Problem:** Citizens may repeat remedies or healthcare beliefs they
have heard from family members, neighbours or online sources. Some
advice may be inaccurate or potentially harmful.

**Implemented approach: myth-related chatbot**

-   A dedicated chatbot accepts healthcare myth-related questions.
-   Citizens can ask about remedies or beliefs they have heard.
-   The chatbot provides relevant responses and healthcare guidance.

**Expected outcome:** Citizens have a place to question potentially
harmful beliefs and receive understandable information.

**Important safety requirement:** A chatbot response should not be
presented as medically verified unless it is grounded in reliable
healthcare sources. A stronger production implementation should classify
claims, retrieve trusted guidance, show source references and
communicate uncertainty where evidence is insufficient.

## 6. Voice-Based ASHA Documentation Workflow

Voice-based documentation is an important part of SAKHI VANI because it
aims to reduce the amount of manual typing required during or after
household visits.

### Intended workflow

1.  The ASHA worker selects the relevant household and beneficiary.
2.  The worker records or provides visit information through the
    available voice interface.
3.  Speech is converted into text where the configured speech service
    supports it.
4.  The application processes the information into the relevant
    structured visit fields.
5.  The ASHA worker reviews and corrects the extracted information.
6.  The worker approves and submits the report.
7.  The report can be generated as a PDF.
8.  The PDF can be shared through the available WhatsApp and email
    options.

### Human review

AI-generated transcription or extracted fields may contain errors. The
ASHA worker must review the content before approval. The system should
not invent missing health information or silently convert uncertain
statements into confirmed facts.

## 7. Reports and Sharing

The application supports report generation and sharing for ASHA
reporting workflows.

### PDF reports

-   Visit information can be organised into a structured document.
-   A PDF can be generated from the supported report workflow.
-   The generated document can be reviewed before sharing.

### Sharing options

-   **WhatsApp:** Share the generated report using the available device
    or application sharing flow.
-   **Email:** Share the generated report through the available email
    flow.

Sharing should be initiated by the user. The application should not
automatically send sensitive health information without the worker's or
user's confirmation and appropriate authorisation.

## 8. Offline Functionality

Offline support is included for supported application workflows so that
the application can remain useful in areas with unreliable connectivity.

The exact offline capabilities depend on which screens, data operations
and services have been implemented for local use.

### Offline design principles

-   Keep supported locally available application functions usable
    without a continuous internet connection.
-   Preserve locally entered information until it can be synchronised,
    where that queueing behaviour is implemented.
-   Provide clear feedback about pending or completed synchronisation.
-   Avoid losing a user's work when connectivity changes.

### Current limitation

The telephone calling assistant is not yet integrated. Real-time calling
functionality generally depends on a configured telephony provider, a
provisioned number, network connectivity and backend call handling.

Do not assume that every AI or external integration works offline.
Cloud-based AI responses, external sharing and telephony may require
connectivity.

## 9. AI and Agent-Based Architecture

SAKHI VANI follows an agent-oriented design: different responsibilities
can be handled by specialised components and coordinated through an
application workflow.

The following are the logical responsibilities represented by the
platform. They should only be described as independently deployed AI
agents if that is how the implementation is actually built.

  -----------------------------------------------------------------------
  Component / agent responsibility    Role
  ----------------------------------- -----------------------------------
  Orchestration                       Understands the request and routes
                                      it to the appropriate capability,
                                      where implemented.

  Voice processing                    Handles speech input and
                                      transcription through the
                                      configured speech service.

  ASHA documentation                  Helps convert visit information
                                      into structured report fields.

  Privacy protection                  Applies PIN/session checks and
                                      access restrictions to protected
                                      information.

  Beneficiary matching                Compares beneficiary information to
                                      identify potential duplicates.

  Myth guidance                       Handles healthcare myth-related
                                      questions and prepares relevant
                                      responses.

  Maternal care                       Supports maternal and
                                      motherhood-related information
                                      workflows.

  Child health                        Supports child-related healthcare
                                      information workflows.

  Elderly care                        Supports elderly-related assistance
                                      workflows.

  Reporting                           Generates structured reports and
                                      PDFs.

  Sharing                             Invokes user-selected WhatsApp or
                                      email sharing options.
  -----------------------------------------------------------------------

### Agentic workflow principle

A coordinated system can receive a request, identify the task, route it
to the relevant component, retrieve or process information, and return a
result for user review.

Not every component needs to be a separate large language model.
Deterministic application services are more appropriate for PIN
verification, access control, duplicate-match rules, session expiry and
other security-sensitive operations.

## 10. High-Level System Architecture

``` mermaid
flowchart TD
    U[ASHA Worker / Rural Citizen] --> UI[SAKHI VANI Application]
    UI --> AUTH[Authentication and PIN Privacy]
    UI --> ORCH[Request Routing / Orchestration]

    ORCH --> VOICE[Voice Processing]
    ORCH --> ASHA[ASHA Documentation]
    ORCH --> DUP[Duplicate Beneficiary Detection]
    ORCH --> MYTH[Myth Guidance Chatbot]
    ORCH --> CARE[Maternal / Child / Elderly Care]

    ASHA --> REPORT[Structured Visit Report]
    REPORT --> PDF[PDF Generation]
    PDF --> SHARE[WhatsApp / Email Sharing]

    AUTH --> DB[(Application Data Store)]
    DUP --> DB
    ASHA --> DB
    CARE --> DB
    MYTH --> KB[Healthcare Information Sources, if configured]

    UI --> OFFLINE[Supported Offline Storage / Workflows]
    OFFLINE --> SYNC[Sync when connectivity is available]
```

This is a conceptual view of the application. The exact runtime
architecture, services and data stores should be documented from the
deployed implementation.

## 11. Privacy, Safety and Responsible Use

SAKHI VANI handles sensitive healthcare-related information. Privacy and
responsible use are essential.

### Privacy principles

-   Protect sensitive maternal information with PIN-based access.
-   Enforce authorisation when retrieving or modifying protected
    records.
-   Avoid storing PINs in plain text.
-   Use secure transport for network requests.
-   Do not expose API keys or service credentials in frontend code.
-   Ask for consent before sharing personal health information.
-   Avoid revealing sensitive details in notifications or voice output.
-   Use synthetic or consented test data during demonstrations.

### Healthcare safety principles

-   The platform is not a diagnostic system.
-   It must not prescribe medicines or independently change a person's
    treatment.
-   It should not invent medical facts, eligibility rules or official
    scheme benefits.
-   Uncertain healthcare claims should be identified as uncertain.
-   Serious symptoms or emergencies require appropriate professional or
    emergency care.
-   AI-generated information should be reviewed and grounded in reliable
    sources before being presented as verified medical guidance.

## 12. Technology Stack

The exact package and service names must match the current repository.
The following table describes the technology layers to document; do not
list a technology as integrated unless it is present in the source code
or configured deployment.

  -----------------------------------------------------------------------
  Layer                               Technology / implementation
  ----------------------------------- -----------------------------------
  Frontend                            Record the actual framework and UI
                                      libraries used in this repository.

  Backend                             Record the actual server framework
                                      and API implementation.

  Database                            Record the actual database and
                                      data-access layer.

  Authentication                      Record the actual authentication
                                      provider and PIN implementation.

  AI integration                      Record the configured LLM/API and
                                      orchestration implementation.

  Speech processing                   Record the actual speech-to-text
                                      and text-to-speech services.

  PDF generation                      Record the actual PDF library or
                                      document-generation service.

  Sharing                             Device share integration and/or
                                      configured WhatsApp/email
                                      mechanisms.

  Offline support                     Record the actual local storage,
                                      caching and synchronisation
                                      mechanism.

  Deployment                          Record the actual hosting provider
                                      and deployed URL.

  Version control                     Git and GitHub.
  -----------------------------------------------------------------------

**Repository accuracy note:** Populate this section from `package.json`,
backend dependency files, environment configuration examples and
deployment settings. Do not infer the stack from the visual design
alone.

## 13. Main User Workflows

### ASHA worker workflow

``` text
Open ASHA SAHAYAK
        |
Select household / beneficiary
        |
Record visit information
        |
Convert voice to text (if configured)
        |
Prepare structured visit report
        |
Review and correct information
        |
Approve and submit
        |
Generate PDF
        |
Share through WhatsApp or email
```

### Citizen privacy workflow

``` text
Open Citizen & Sakhi Care
        |
Select protected maternal information
        |
Enter private PIN
        |
Verify PIN
        |
Access protected information
        |
Private session expires
        |
Protected area locks again
```

### Duplicate beneficiary workflow

``` text
Enter new beneficiary
        |
Compare with existing records
        |
Analyse name and available details
        |
Identify possible match
        |
Display candidate to ASHA worker
        |
Worker confirms or rejects match
        |
Prevent unnecessary duplicate registration
```

### Healthcare myth question workflow

``` text
Citizen enters a myth-related question
        |
Chatbot processes the question
        |
Prepare a relevant response
        |
Present guidance to the citizen
        |
Show trusted references when configured
```

## 14. Demonstration Scenarios

The following scenarios can be used to demonstrate the application.

### Demo 1 --- ASHA visit documentation

-   Open ASHA SAHAYAK.
-   Select a beneficiary.
-   Provide visit information through the available voice workflow.
-   Review the structured report.
-   Generate the PDF.
-   Share it through WhatsApp or email.

### Demo 2 --- Shared phone privacy

-   Open the citizen module on a shared-device scenario.
-   Attempt to access protected maternal information.
-   Show the PIN verification step.
-   Demonstrate that an incorrect PIN is rejected.
-   Enter the correct PIN.
-   Show the temporary private session and its expiry/locking behaviour.

### Demo 3 --- Duplicate beneficiary detection

-   Register a sample beneficiary.
-   Attempt a second registration with a spelling variation.
-   Show the potential duplicate result.
-   Review the matching information.
-   Confirm or reject the match as the ASHA worker.

### Demo 4 --- Harmful healthcare myth question

-   Open the myth-related chatbot.
-   Ask a sample healthcare myth question.
-   Show the response.
-   If trusted sources are integrated, show the references used.

### Demo 5 --- Offline workflow

-   Open a workflow that is confirmed to work offline.
-   Disable network connectivity.
-   Demonstrate the supported offline operation.
-   Restore connectivity and show synchronisation if implemented.

Use synthetic demonstration records. Do not expose real beneficiaries'
personal or medical information during a public demo.

## 15. Setup and Running the Project

The exact commands depend on the repository's actual framework and
scripts. Follow the commands defined in the project files.

### Prerequisites

-   Git
-   Node.js and npm, if the frontend uses a Node-based toolchain
-   The runtime required by the backend, if applicable
-   Required environment variables and API credentials for configured
    integrations

### Clone the repository

``` bash
git clone https://github.com/prajwal07-m05/Sakhi-Vaani.git
cd Sakhi-Vaani
```

### Inspect the project

``` bash
ls
```

Check the project files for: - `package.json` - `README` or setup
documentation - Backend dependency files - `.env.example` - Build and
deployment configuration

### Install dependencies

For a Node.js project, use the package manager and lockfile included in
the repository. For example:

``` bash
npm install
```

### Run locally

Use the actual scripts declared in `package.json`. For example, if the
project defines a `dev` script:

``` bash
npm run dev
```

If the repository has a separate backend, follow its own setup
instructions.

Do not commit private `.env` files, API keys, passwords or production
credentials.

## 16. Configuration

Create local environment configuration using the variable names
documented by the project.

A safe example file may look like this:

``` env
# Add only variables actually required by this project.
# Never commit real secret values.

AI_PROVIDER_API_KEY=
DATABASE_URL=
AUTH_CONFIGURATION=
SPEECH_SERVICE_CONFIGURATION=
EMAIL_SHARING_CONFIGURATION=
```

These are illustrative placeholders, not confirmed variable names. Use
the actual names expected by the source code and provide an
`.env.example` containing empty or sample values.

## 17. Current Scope and Limitations

The following reflects the implementation status communicated by the
team. Confirm each item against the current deployed build before
publishing this README.

  Capability                                   Team-reported status
  -------------------------------------------- --------------------------------------
  ASHA SAHAYAK module                          Implemented in the current prototype
  CITIZEN & SAKHI CARE module                  Implemented in the current prototype
  PIN-based shared-phone privacy               Implemented
  Temporary private access                     Implemented
  Duplicate beneficiary detection              Implemented
  Myth-related chatbot                         Implemented
  Voice-based visit documentation              Implemented
  Structured visit report and PDF generation   Implemented
  WhatsApp sharing option                      Implemented
  Email sharing option                         Implemented
  Offline functionality                        Implemented for supported workflows
  Telephone calling assistant                  Not yet integrated

### Limitations to communicate clearly

-   Telephone calling assistant functionality is not yet integrated.
-   Offline support does not imply that every external AI, email,
    WhatsApp or telephony service works without internet.
-   Duplicate detection identifies potential matches; human confirmation
    is important before records are linked or merged.
-   The myth chatbot should not be described as a clinically validated
    medical authority unless its source verification and safety process
    have been implemented and tested.
-   PIN access is only one part of privacy protection; backend
    authorisation and secure data handling are also required.

## 18. Future Enhancements

Potential next steps include:

-   Integrating a real telephone calling assistant through a configured
    telephony provider.
-   Strengthening multilingual name matching across supported scripts.
-   Improving trusted-source retrieval and references for healthcare
    myth guidance.
-   Expanding automated tests for privacy, session expiry and access
    control.
-   Improving offline synchronisation and conflict handling.
-   Adding accessibility improvements for users with limited digital
    literacy.
-   Expanding language support after validating speech recognition and
    response quality.
-   Adding monitoring, audit and operational safeguards for production
    use.

## 19. Team

**NonChalant Coders**

  Name                 Team
  -------------------- --------------
  Prajwal M            Project team
  Preksha M            Project team
  VM Vijaya Chinmayi   Project team
  Sneha Bansode        Project team

------------------------------------------------------------------------

## Closing Note

SAKHI VANI is built around a simple belief:

**Every voice matters. Every community deserves care.**

By connecting ASHA workers and rural citizens through accessible
healthcare workflows, voice-based documentation, privacy protection,
beneficiary data quality and healthcare guidance, SAKHI VANI aims to
make community healthcare support more organised and approachable.

*Built with care by NonChalant Coders.*
