CREATE TABLE USERS (
    ID TEXT PRIMARY KEY,
    NAME TEXT NOT NULL,
    EMAIL TEXT NOT NULL,
    LOCATION TEXT NOT NULL,
    ROLE TEXT NOT NULL,
    DEPARTMENT TEXT NOT NULL,
    STATUS TEXT NOT NULL
);

INSERT INTO users ("id", "name", "email", "location", "role", "department", "status")
VALUES
    ('03a582be-a581-452d-a9b7-ef8a3da08f1e', 'Fatima Al-Sayed', 'f.alsayed@company.com', 'Cairo, EG', 'Admin', 'IT', 'Active'),
    ('30280c7b-afc3-41bf-b7d2-1fc8016f4bf2', 'Ewa Kowalski', 'e.kowalski@company.com', 'Seoul, KR', 'User', 'RH', 'Active'),
    ('3057e79e-eb68-4d1c-986e-269b7e84549a', 'Diego Mendoza', 'd.mendoza@company.com', 'Mexico City, MX', 'User', 'IT', 'Active'),
    ('5a0b7412-e768-4fde-9b8a-3bfecbb19895', 'Cheng Wei', 'c.wei@company.com', 'Shanghai, CN','User', 'IT', 'Active'),
    ('671fb99c-efe2-456d-92ec-70229d5c5cbd', 'Emma Laurent', 'e.laurent@company.com', 'Berlin, DE','User', 'IT', 'Active'),
    ('7851514c-661d-4190-9ee1-7e3c63b28e38', 'Anna Visconti', 'anna.visconti@company.com', 'Rome, IT','User', 'IT', 'Active'),
    ('79abeeb2-c440-460b-a8a8-76c96c4f017b', 'Alex Thompson', 'a.tompson@company.com', 'San Francisco, US','User', 'IT', 'Inactive'),
    ('7ec46305-ace1-4730-be14-58983d077e85', 'Astrid Andersen', 'a.andersen@company.com', 'Oslo, NO','User', 'IT', 'Inactive'),
    ('8c8a4c01-b262-4dae-a6e9-d06c48f48c6d', 'David Kim', 'd.kim@company.com', 'Paris, FR','User', 'IT', 'Active'),
    ('c2e7b75f-7d0b-42ca-a79b-f3354892713a', 'Alex Allan', 'alex.allan@company.com', 'São Paulo, BR','User', 'IT', 'Active');

CREATE TABLE PROJECTS (
    ID TEXT PRIMARY KEY,
    PROJECT_LEAD TEXT NOT NULL REFERENCES USERS(ID) ON DELETE SET NULL,
    ANGEBOTSNUMMER TEXT NOT NULL,
    CLIENT TEXT NOT NULL,
    FRAME_CONTRACT TEXT,
    PURCHASE_ORDER TEXT NOT NULL,
    PROJECT_NAME TEXT NOT NULL,
    LINK_TO_PROJECT_FOLDER TEXT NOT NULL,
    TARGET_MARGIN NUMERIC,
    REVENUE NUMERIC NOT NULL,
    MAN_DAYS NUMERIC NOT NULL,
    STATUS TEXT NOT NULL,
    DESCRIPTION TEXT NOT NULL,
    COMPLETED_DAYS TEXT NOT NULL,
    BUDGET NUMERIC NOT NULL,
    PERIOD_START DATE NOT NULL,
    PERIOD_END DATE NOT NULL,
    TECHNOLOGIES TEXT[]
);

INSERT INTO projects (
    id, project_lead, angebotsnummer, client, frame_contract, purchase_order,
    project_name, link_to_project_folder, target_margin, revenue, man_days,
    status, description, completed_days, budget, period_start, period_end, technologies
) VALUES
      (
          'PRJ-001', '03a582be-a581-452d-a9b7-ef8a3da08f1e', 'AN-001', 'Acme Corp', 'FC-101', 'PO-5001',
          'Website Redesign', 'https://example.com/folder/prj001', 0.25, 50000, 120,
          'Active', 'Redesign Acme’s main site with a modern look.', 20, 60000,
          '2024-01-01', '2024-06-30', ARRAY['Terraform', 'Java']
      ),
      (
          'PRJ-002', '3057e79e-eb68-4d1c-986e-269b7e84549a', 'AN-002', 'Beta Inc', 'FC-102', 'PO-5002',
          'Mobile App Development', 'https://example.com/folder/prj002', 0.30, 75000, 150,
          'Active', 'Develop a new cross-platform app.', 40, 85000,
          '2024-02-01', '2024-08-01', ARRAY['AWS', 'React']
      ),
      (
          'PRJ-003', '5a0b7412-e768-4fde-9b8a-3bfecbb19895', 'AN-003', 'Gamma Ltd', 'FC-103', 'PO-5003',
          'Cloud Migration', 'https://example.com/folder/prj003', 0.20, 65000, 100,
          'Completed', 'Move infrastructure to the cloud.', 100, 70000,
          '2023-09-01', '2024-01-31', ARRAY['React', 'Java']
      );

CREATE TABLE ALLOCATIONS (
    ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
    PROJECT_ID TEXT NOT NULL REFERENCES PROJECTS(ID) ON DELETE SET NULL,
    USER_ID TEXT NOT NULL REFERENCES USERS(ID) ON DELETE SET NULL,
    START_DATE DATE NOT NULL,
    END_DATE DATE,
    PERCENTAGE NUMERIC NOT NULL,
    ROLE TEXT NOT NULL
);

INSERT INTO allocations (project_id, user_id, start_date, end_date, percentage, role) VALUES
    ('PRJ-001', '30280c7b-afc3-41bf-b7d2-1fc8016f4bf2', '2024-01-01', '2024-06-30', 1, 'Frontend Developer'),
    ('PRJ-001', '8c8a4c01-b262-4dae-a6e9-d06c48f48c6d', '2024-02-01', '2024-06-30', 0.5, 'UX Designer'),
    ('PRJ-002', '671fb99c-efe2-456d-92ec-70229d5c5cbd', '2024-02-15', '2024-08-01', 1, 'Mobile Developer'),
    ('PRJ-002', '7851514c-661d-4190-9ee1-7e3c63b28e38', '2024-03-01', '2024-07-15', 0.75, 'QA Engineer'),
    ('PRJ-003', '7ec46305-ace1-4730-be14-58983d077e85', '2023-09-01', '2024-01-15', 1, 'Cloud Engineer'),
    ('PRJ-003', '79abeeb2-c440-460b-a8a8-76c96c4f017b', '2023-10-01', '2024-01-31', 0.6, 'DevOps Specialist');


CREATE TABLE TIME_TRACKING (
    ID UUID PRIMARY KEY DEFAULT UUID_GENERATE_V4(),
    PROJECT_ID TEXT NOT NULL REFERENCES PROJECTS(ID) ON DELETE SET NULL,
    USER_ID TEXT NOT NULL REFERENCES USERS(ID) ON DELETE SET NULL,
    DATE DATE NOT NULL,
    HOURS NUMERIC NOT NULL,
    DESCRIPTION TEXT NOT NULL,
    STATUS TEXT NOT NULL CHECK (STATUS IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED')),
    TAGS TEXT[],
    BILLABLE BOOLEAN
);

INSERT INTO time_tracking (id, project_id, user_id, date, hours, description, status, tags, billable) VALUES
('158cc4ad-8c08-4c09-905f-bcd111f68beb', 'PRJ-001', '8c8a4c01-b262-4dae-a6e9-d06c48f48c6d', '2024-01-20', 3.5, 'Bug fixing', 'Submitted', ARRAY['Bug', 'Fix'], false),
('1f62017b-c286-45b8-8079-a64e71cd92ae', 'PRJ-001', '8c8a4c01-b262-4dae-a6e9-d06c48f48c6d', '2024-02-29', 3.8, 'Bug fixing', 'Submitted', ARRAY['Bug'], true),
('694a3374-09b2-41a0-8b14-725d90cdc808', 'PRJ-001', '30280c7b-afc3-41bf-b7d2-1fc8016f4bf2', '2024-01-12', 4.0, 'Documentation', 'Submitted', ARRAY['Documentation'], true),
('b5932fa4-78ae-42c5-b555-d029e6b7b58a', 'PRJ-002', '79abeeb2-c440-460b-a8a8-76c96c4f017b', '2024-03-24', 6.6, 'Feature development', 'Approved', ARRAY['Development'], true),
('7db9a7e1-c3c9-417f-8b0a-587fbe757408', 'PRJ-003', '7851514c-661d-4190-9ee1-7e3c63b28e38', '2024-02-14', 4.3, 'Documentation', 'Approved', ARRAY['Documentation'], true),
('09322202-d9e5-47b9-b27e-c58c41eb4d84', 'PRJ-001', '30280c7b-afc3-41bf-b7d2-1fc8016f4bf2', '2024-03-01', 3.5, 'Feature development', 'Rejected', ARRAY['Development'], true),
('a7924a5b-0463-404b-9cf5-cc918d4cf956', 'PRJ-003', '30280c7b-afc3-41bf-b7d2-1fc8016f4bf2', '2024-02-04', 7.1, 'Meeting', 'Approved', ARRAY['Meeting'], true),
('5d0389f5-78a6-4e9b-aac4-86562a99d238', 'PRJ-002', '7ec46305-ace1-4730-be14-58983d077e85', '2024-02-20', 6.5, 'Bug fixing', 'Submitted', ARRAY['Bug'], true),
('1940ad6a-3386-4d59-97bc-6f5027a18d0e', 'PRJ-003', '7851514c-661d-4190-9ee1-7e3c63b28e38', '2024-01-29', 2.0, 'Feature development', 'Submitted', ARRAY['Development'], true),
('2033b32f-47e4-4592-a60b-4018322058f5', 'PRJ-002', '7851514c-661d-4190-9ee1-7e3c63b28e38', '2024-01-18', 7.3, 'Documentation', 'Rejected', ARRAY['Documentation'], true);

CREATE TABLE DEPARTMENTS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    NAME TEXT NOT NULL
);

INSERT INTO departments (name) VALUES
('Engineering'),
('Marketing'),
('Sales'),
('Product'),
('Human Resources');

CREATE TABLE TEAMS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    NAME TEXT NOT NULL,
    DEPARTMENT_ID UUID NOT NULL REFERENCES DEPARTMENTS(ID) ON DELETE CASCADE
);

INSERT INTO TEAMS (id, name, department_id) VALUES
('f8e2de84-62f0-4d3b-930b-4f4a2de9321f', 'Platform Team', '466e4099-33fa-431d-b17e-84e94936e0f4'),
('cebc4ad7-51f1-4782-bbf4-dfbfc6dfb2ef', 'Content Team', '71d0989b-f0bd-44f9-926d-306e80ed02b4'),
('db235a4e-6d71-4144-b5d8-5cb6ec7f0dd3', 'Sales Enablement', '58fc917a-3e69-4393-a7f2-9ab3d85eba55'),
('7dfcb3e1-9460-499e-a5c0-0e5fae218b26', 'Product Strategy', '0da43815-e7e5-4cf7-8426-5014930023e8'),
('a7bc49b2-bcd5-4b8d-8592-35d1fa2a252b', 'Recruiting Team', '7128c178-db61-4752-813d-c65ab4378cad');


CREATE TABLE GOALS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    TITLE TEXT NOT NULL,
    DESCRIPTION TEXT,
    PERIOD_EVALUATION TEXT NOT NULL,
    LEVEL TEXT NOT NULL,
    STATUS TEXT NOT NULL,
    PRIORITY TEXT NOT NULL,
    PROGRESS NUMERIC NOT NULL DEFAULT 0,
    START_DATE DATE NOT NULL,
    END_DATE DATE NOT NULL,
    OWNER_ID TEXT NOT NULL REFERENCES USERS(ID) ON DELETE SET NULL,
    TEAM_ID UUID REFERENCES TEAMS(ID) ON DELETE SET NULL,
    DEPARTMENT_ID UUID REFERENCES DEPARTMENTS(ID) ON DELETE SET NULL,
    CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO GOALS (id, title, description, period_evaluation, level, status, priority, progress,start_date, end_date, owner_id, team_id, department_id) VALUES
('0d1a0f2d-faa9-4fc3-92c3-8b5fc7a181e9', 'Improve Platform Reliability', 'Reduce downtime and improve system uptime to 99.9%', 'Quarterly', 'Team', 'In Progress', 'High', 45,
 '2025-01-01', '2025-03-31', 'auth0|67e52261b7b1cd59493a3e0a', 'f8e2de84-62f0-4d3b-930b-4f4a2de9321f', '466e4099-33fa-431d-b17e-84e94936e0f4'),
('c46d9b21-6a17-42f7-b626-7fc9aa0188b7', 'Launch Q2 Content Campaign', 'Create and publish 20 new blog posts and 5 case studies', 'Quarterly', 'Team', 'Not Started', 'Medium', 0,
 '2025-04-01', '2025-06-30', 'auth0|67e52261b7b1cd59493a3e0a', 'cebc4ad7-51f1-4782-bbf4-dfbfc6dfb2ef', '71d0989b-f0bd-44f9-926d-306e80ed02b4'),
('3fcb8f6f-1de3-4178-a137-96c763f91a97', 'Increase Lead Conversion Rate', 'Raise conversion rate from 12% to 18% across all channels', 'Quarterly', 'Department', 'In Progress', 'High', 60,
 '2025-01-01', '2025-03-31', 'auth0|67e52261b7b1cd59493a3e0a', 'db235a4e-6d71-4144-b5d8-5cb6ec7f0dd3', '58fc917a-3e69-4393-a7f2-9ab3d85eba55'),
('ecaa7bc4-5146-41bb-b195-02f45a01b4ed', 'Define 2025 Product Roadmap', 'Complete planning and scope definition for next year', 'Annual', 'Department', 'Completed', 'High', 100,
 '2025-01-01', '2025-12-31', 'auth0|67e52261b7b1cd59493a3e0a', '7dfcb3e1-9460-499e-a5c0-0e5fae218b26', '0da43815-e7e5-4cf7-8426-5014930023e8'),
('a20536d2-d676-40c5-b317-6f9cc73f7d71', 'Streamline Hiring Process', 'Reduce average hiring time from 45 to 30 days', 'Quarterly', 'Team', 'In Progress', 'Medium', 35,
 '2025-01-01', '2025-03-31', 'auth0|67e52261b7b1cd59493a3e0a', 'a7bc49b2-bcd5-4b8d-8592-35d1fa2a252b', '7128c178-db61-4752-813d-c65ab4378cad');

CREATE TABLE GOAL_TASKS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    TITLE TEXT NOT NULL,
    COMPLETED BOOLEAN NOT NULL DEFAULT FALSE,
    GOAL_ID UUID NOT NULL REFERENCES GOALS(ID) ON DELETE CASCADE,
    CREATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UPDATED_AT TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO GOAL_TASKS (id, title, completed, goal_id) VALUES
('9be7aa3d-9db3-43a0-96ed-c8b9ac78893e', 'Set up monitoring alerts', TRUE, '0d1a0f2d-faa9-4fc3-92c3-8b5fc7a181e9'),
('b3e42388-fce6-4622-9371-6a41fa7fe303', 'Draft Q2 blog topics', FALSE, 'c46d9b21-6a17-42f7-b626-7fc9aa0188b7'),
('e1c99e2d-4796-41f4-bb71-0edb59aa397b', 'Revamp email templates', TRUE, '3fcb8f6f-1de3-4178-a137-96c763f91a97'),
('d77c38c5-985f-4f2e-bb01-33066a43b471', 'Finalize product themes', TRUE, 'ecaa7bc4-5146-41bb-b195-02f45a01b4ed'),
('a04c6d26-1cc0-45ae-83bb-49933e7b8c89', 'Automate interview scheduling', FALSE, 'a20536d2-d676-40c5-b317-6f9cc73f7d71');

CREATE TABLE EPICS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    TITLE TEXT NOT NULL,
    DESCRIPTION TEXT,
    COLOR TEXT
);

INSERT INTO epics (id, title, description, color) VALUES
    ('660c5d94-6fec-49cf-9f0b-436dffce2c0e', 'Authentication Refactor', 'Refactor the entire Auth flow using Auth0', '#FF5733'),
    ('859f2598-f85a-42ff-9456-8aeee65f2a2c', 'Mobile Redesign', 'New UX/UI for mobile app', '#33A1FF'),
    ('f4afc13b-bf1f-41fe-8699-ba8f1136fa28', 'Billing System', 'Migrate billing to Stripe', '#8D33FF'),
    ('003b8b69-71a9-48b4-b170-c3bf0d2d35c5', 'Performance Audit', 'Improve API response times', '#33FF88'),
    ('2d17d6c4-8649-44d4-8f3a-10ebec3232c0', 'Dark Mode Rollout', 'Add dark mode across all screens', '#FFD700');

CREATE TABLE TASKS (
    ID UUID PRIMARY KEY DEFAULT GEN_RANDOM_UUID(),
    TITLE TEXT NOT NULL,
    TYPE TEXT CHECK (TYPE IN ('BUG', 'FEATURE', 'TASK', 'IMPROVEMENT', 'EPIC')) NOT NULL,
    PRIORITY TEXT CHECK (PRIORITY IN ('LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST')) NOT NULL,
    LABELS TEXT[],
    EPIC_ID UUID REFERENCES EPICS(ID) ON DELETE SET NULL,
    DESCRIPTION TEXT,
    ASSIGNEE_ID TEXT NOT NULL REFERENCES USERS(ID) ON DELETE SET NULL,
    REPORTER_ID TEXT NOT NULL REFERENCES USERS(ID) ON DELETE SET NULL,
    STATUS TEXT CHECK (STATUS IN ('ON_HOLD', 'BLOCKED', 'IN_PROGRESS', 'REVIEW', 'DONE')) NOT NULL,
    CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
    UPDATED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
    DUE_DATE TIMESTAMP,
    ESTIMATED_HOURS NUMERIC,
    ACTUAL_HOURS NUMERIC,
    RELATED_TASK_IDS UUID[],
    SUBTASK_IDS UUID[]
);

INSERT INTO tasks (title, type, priority, labels, epic_id, description,assignee_id, reporter_id, status,due_date, estimated_hours, actual_hours,related_task_ids, subtask_ids) VALUES
      ('Implement Auth0 Roles','FEATURE','HIGH',ARRAY['auth', 'backend'],'660c5d94-6fec-49cf-9f0b-436dffce2c0e','Set up role-based access control with Auth0 rules.','auth0|67e52261b7b1cd59493a3e0a','auth0|67e52261b7b1cd59493a3e0a','IN_PROGRESS',NOW() + INTERVAL '5 days',6,NULL,NULL,NULL),
      ('Revamp Mobile Navigation','IMPROVEMENT','MEDIUM',ARRAY['mobile', 'design'],'859f2598-f85a-42ff-9456-8aeee65f2a2c','Improve mobile UX navigation structure and transitions.','auth0|67e52261b7b1cd59493a3e0a','auth0|67e52261b7b1cd59493a3e0a','ON_HOLD',NOW() + INTERVAL '7 days',4,NULL,NULL,NULL),
      ('Handle Stripe Webhook Failures','BUG','HIGHEST',ARRAY['billing', 'backend'],'f4afc13b-bf1f-41fe-8699-ba8f1136fa28','Fix missing logic in handling Stripe webhook errors.','auth0|67e52261b7b1cd59493a3e0a','auth0|67e52261b7b1cd59493a3e0a','BLOCKED',NOW() + INTERVAL '3 days',3,NULL,NULL,NULL),
      ('Analyze Slow API Endpoints','TASK','MEDIUM',ARRAY['performance', 'metrics'],'003b8b69-71a9-48b4-b170-c3bf0d2d35c5','Audit slowest API endpoints and collect metrics.','auth0|67e52261b7b1cd59493a3e0a','auth0|67e52261b7b1cd59493a3e0a','REVIEW',NOW() + INTERVAL '2 days',5,4,NULL,NULL),
      ('Apply Global Dark Theme','EPIC','HIGH',ARRAY['ui', 'dark-mode'],'2d17d6c4-8649-44d4-8f3a-10ebec3232c0','Define and apply global styles for dark mode.','auth0|67e52261b7b1cd59493a3e0a','auth0|67e52261b7b1cd59493a3e0a','DONE',NOW() + INTERVAL '1 day',8,7,NULL,NULL);


CREATE TABLE ATTACHMENTS (
    ID UUID PRIMARY KEY,
    TASK_ID UUID REFERENCES TASKS(ID) ON DELETE CASCADE,
    NAME TEXT NOT NULL,
    URL TEXT NOT NULL,
    TYPE TEXT,
    SIZE INTEGER,
    UPLOADED_AT TIMESTAMP NOT NULL DEFAULT NOW(),
    UPLOADED_BY_ID TEXT NOT NULL REFERENCES USERS(ID) ON DELETE SET NULL
);

INSERT INTO attachments (id, task_id, name, url, type, size, uploaded_at, uploaded_by_id) VALUES
      ('8aebf54e-3d3b-4e77-9f45-d2d4e57a8712','5e6f48d2-938b-4f7c-983b-7bb170378a83','auth-rbac-diagram.png','https://example.com/files/auth-rbac-diagram.png','image/png',204800,NOW(),'auth0|67e52261b7b1cd59493a3e0a'),
      ('96d2db32-e83c-4d64-89c2-d6c6528390b2','f6dd4a4e-83e4-4e5f-bdf1-e817f789ee8d','mobile-wireframe.pdf','https://example.com/files/mobile-wireframe.pdf','application/pdf',512000,NOW(),'auth0|67e52261b7b1cd59493a3e0a'),
      ('db3b76c1-fd8a-4f61-9b3e-3f30d8ff8727','ea91ee89-5276-4ceb-a472-60b8c77541af','stripe-webhooks.log','https://example.com/files/stripe-webhooks.log','text/plain',10240,NOW(),'auth0|67e52261b7b1cd59493a3e0a'),
      ('0d0bdc77-4e8e-46f0-95b7-946bcd5b8c91','1cc0c84b-aed9-4edd-b404-a0fd9b2387fe','api-metrics-report.csv','https://example.com/files/api-metrics-report.csv','text/csv',30208,NOW(),'auth0|67e52261b7b1cd59493a3e0a'),
      ('40f6d457-02fc-47a5-901e-9462c7b9a29c','48692b7a-7fac-4ef0-bd88-f4bea5be2c9a','dark-theme-screenshots.zip','https://example.com/files/dark-theme-screenshots.zip','application/zip',1048576,NOW(),'auth0|67e52261b7b1cd59493a3e0a');

CREATE TABLE COMMENTS (
    ID UUID PRIMARY KEY,
    TASK_ID UUID REFERENCES TASKS(ID) ON DELETE CASCADE,
    USER_ID TEXT NOT NULL REFERENCES USERS(ID) ON DELETE SET NULL,
    CONTENT TEXT NOT NULL,
    CREATED_AT TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO comments (id, task_id, user_id, content, created_at) VALUES
      ('bcd1035e-eed6-45d2-b5dc-cf5d6cfd785e','5e6f48d2-938b-4f7c-983b-7bb170378a83','auth0|67e52261b7b1cd59493a3e0a','Make sure the Auth0 rule executes before the JWT gets issued.',NOW()),
      ('0fc08358-d573-4567-bbf1-d20f73065f35','f6dd4a4e-83e4-4e5f-bdf1-e817f789ee8d','auth0|67e52261b7b1cd59493a3e0a','Check the back gesture handling on Android before finalizing transitions.',NOW()),
      ('cb03bfe4-e9e5-4e55-91d4-4584c2dbb59d','ea91ee89-5276-4ceb-a472-60b8c77541af','auth0|67e52261b7b1cd59493a3e0a','Stripe retries failed webhooks. We should log and notify after 3 fails.',NOW()),
      ('a20686ae-8de1-4f99-8b4a-2034a819de6e','1cc0c84b-aed9-4edd-b404-a0fd9b2387fe','auth0|67e52261b7b1cd59493a3e0a','Check if `/v1/users` endpoint still has high latency under load.',NOW()),
      ('3a4efc26-49c9-4fa4-b09e-3e2a432f5c9e','48692b7a-7fac-4ef0-bd88-f4bea5be2c9a','auth0|67e52261b7b1cd59493a3e0a','Nice work on the theme tokens! Let’s polish input focus states.',NOW());