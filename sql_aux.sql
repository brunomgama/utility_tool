create table users (
    id uuid primary key default uuid_generate_v4(),
    name text not null,
    email text not null,
    location text not null,
    status text not null
);

insert into users (name, email, location, status)
values
    ('Alex Allan', 'alex.allan@company.com', 'São Paulo, BR', 'Active'),
    ('Anna Visconti', 'anna.visconti@company.com', 'Rome, IT', 'Active'),
    ('Astrid Andersen', 'a.andersen@company.com', 'Oslo, NO', 'Inactive'),
    ('Cheng Wei', 'c.wei@company.com', 'Shanghai, CN', 'Active'),
    ('David Kim', 'd.kim@company.com', 'Paris, FR', 'Active'),
    ('Emma Laurent', 'e.laurent@company.com', 'Berlin, DE', 'Active'),
    ('Diego Mendoza', 'd.mendoza@company.com', 'Mexico City, MX', 'Active'),
    ('Fatima Al-Sayed', 'f.alsayed@company.com', 'Cairo, EG', 'Active'),
    ('Ewa Kowalski', 'e.kowalski@company.com', 'Seoul, KR', 'Active'),
    ('Alex Thompson', 'a.tompson@company.com', 'San Francisco, US', 'Inactive');


CREATE TABLE projects (
    id text NOT NULL,
    projectLead uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    angebotsnummer text NOT NULL,
    client text NOT NULL,
    frameContract text NOT NULL,
    purchaseOrder text NOT NULL,
    projectName text NOT NULL,
    linkToProjectFolder text NOT NULL,
    targetMargin numeric NOT NULL,
    revenue numeric NOT NULL,
    manDays numeric NOT NULL,
    status text NOT NULL,
    name text NOT NULL,
    periodStart date NOT NULL,
    periodEnd date NOT NULL
);

INSERT INTO projects (id,projectLead,angebotsnummer,client,frameContract,purchaseOrder,projectName,linkToProjectFolder,targetMargin,revenue,manDays,status,name,periodStart,periodEnd)
VALUES
('proj-001','247ac5ea-5d98-4d79-9f00-08043497c45e','ANG-2024-001','Acme Corp','FC-2023-ACME','PO-1001','Website Redesign','https://drive.example.com/folder/project-001',25.5,50000,120,'Active','Website Revamp','2024-01-15','2024-06-30'),
('proj-002','03f0587b-82a3-41e9-978b-19c0649dd6ad','ANG-2024-002','Globex Ltd','FC-2022-GLOBEX','PO-1002','Mobile App Development','https://drive.example.com/folder/project-002',30.0,75000,180,'Pending','App Dev Phase 1','2024-03-01','2024-08-31'),
('proj-003','26e3b41c-f66d-4ba8-8828-e6d2f2f7d746','ANG-2024-003','Initech','FC-2024-INITECH','PO-1003','Cloud Migration','https://drive.example.com/folder/project-003',20.0,100000,200,'Finished','Infra Migration','2023-09-01','2024-02-28'),
('proj-004', '3fad6a37-ec3d-4957-92e6-1a5f6a255b3c', 'ANG-2024-004', 'Umbrella Inc', 'FC-2021-UMBR', 'PO-1004', 'Data Warehouse Setup', 'https://drive.example.com/folder/project-004', 18.75, 65000, 150, 'Inactive', 'DWH Setup', '2024-04-01', '2024-12-31');
