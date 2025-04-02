create table users (
    id text PRIMARY KEY,
    name text not null,
    email text not null,
    location text not null,
    role text not null,
    department text not null,
    status text not null
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

CREATE TABLE projects (
    id text PRIMARY KEY,
    project_lead text NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    angebotsnummer text NOT NULL,
    client text NOT NULL,
    frame_contract text NOT NULL,
    purchase_order text NOT NULL,
    project_name text NOT NULL,
    link_to_project_folder text NOT NULL,
    target_margin numeric NOT NULL,
    revenue numeric NOT NULL,
    man_days numeric NOT NULL,
    status text NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    completed_days text NOT NULL,
    budget numeric NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL
);

INSERT INTO projects (
    id, project_lead, angebotsnummer, client, frame_contract, purchase_order,
    project_name, link_to_project_folder, target_margin, revenue, man_days,
    status, name, description, completed_days, budget, period_start, period_end
) VALUES
      (
          'PRJ-001', '03a582be-a581-452d-a9b7-ef8a3da08f1e', 'AN-001', 'Acme Corp', 'FC-101', 'PO-5001',
          'Website Redesign', 'https://example.com/folder/prj001', 0.25, 50000, 120,
          'Active', 'Website Redesign for Acme', 'Redesign Acme’s main site with a modern look.', 20, 60000,
          '2024-01-01', '2024-06-30'
      ),
      (
          'PRJ-002', '3057e79e-eb68-4d1c-986e-269b7e84549a', 'AN-002', 'Beta Inc', 'FC-102', 'PO-5002',
          'Mobile App Development', 'https://example.com/folder/prj002', 0.30, 75000, 150,
          'Active', 'Beta Mobile App', 'Develop a new cross-platform app.', 40, 85000,
          '2024-02-01', '2024-08-01'
      ),
      (
          'PRJ-003', '5a0b7412-e768-4fde-9b8a-3bfecbb19895', 'AN-003', 'Gamma Ltd', 'FC-103', 'PO-5003',
          'Cloud Migration', 'https://example.com/folder/prj003', 0.20, 65000, 100,
          'Completed', 'Gamma Cloud Migration', 'Move infrastructure to the cloud.', 100, 70000,
          '2023-09-01', '2024-01-31'
      );



CREATE TABLE allocations (
    id uuid primary key default uuid_generate_v4(),
    project_id text NOT NULL REFERENCES projects(id) ON DELETE SET NULL,
    user_id text NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    start_date date NOT NULL,
    end_date date NOT NULL,
    percentage numeric NOT NULL,
    role text NOT NULL
);

INSERT INTO allocations (project_id, user_id, start_date, end_date, percentage, role) VALUES
    ('PRJ-001', '30280c7b-afc3-41bf-b7d2-1fc8016f4bf2', '2024-01-01', '2024-06-30', 1, 'Frontend Developer'),
    ('PRJ-001', '8c8a4c01-b262-4dae-a6e9-d06c48f48c6d', '2024-02-01', '2024-06-30', 0.5, 'UX Designer'),
    ('PRJ-002', '671fb99c-efe2-456d-92ec-70229d5c5cbd', '2024-02-15', '2024-08-01', 1, 'Mobile Developer'),
    ('PRJ-002', '7851514c-661d-4190-9ee1-7e3c63b28e38', '2024-03-01', '2024-07-15', 0.75, 'QA Engineer'),
    ('PRJ-003', '7ec46305-ace1-4730-be14-58983d077e85', '2023-09-01', '2024-01-15', 1, 'Cloud Engineer'),
    ('PRJ-003', '79abeeb2-c440-460b-a8a8-76c96c4f017b', '2023-10-01', '2024-01-31', 0.6, 'DevOps Specialist');


CREATE TABLE project_technologies (
    project_id text NOT NULL REFERENCES projects(id) ON DELETE SET NULL,
    technology text NOT NULL
);

INSERT INTO project_technologies (project_id, technology) VALUES
    ('PRJ-001', 'React'),
    ('PRJ-001', 'Figma'),
    ('PRJ-002', 'Flutter'),
    ('PRJ-002', 'Firebase'),
    ('PRJ-003', 'AWS'),
    ('PRJ-003', 'Terraform');

CREATE TABLE time_tracking (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE SET NULL,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    hours NUMERIC NOT NULL,
    description TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('Draft', 'Submitted', 'Approved', 'Rejected')),
    tags TEXT[],
    billable BOOLEAN
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
