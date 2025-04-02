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
    status text NOT NULL,
    client text NOT NULL,
    name text NOT NULL,
    periodStart date NOT NULL,
    periodEnd date NOT NULL,
    projectLead uuid NOT NULL REFERENCES users(id) ON DELETE SET NULL
);

INSERT INTO projects
("id", "status", "client", "name", "periodstart", "periodend", "projectlead") VALUES
('BW0821Nr4', 'Active', 'Beitragsservice', 'Scrum-Master', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('DIC2025Q1', 'Active', 'Diconium', 'OneAppDev', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('DXO2025001', 'Active', 'DX.One', 'RetailCap', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('DXO2025003HJ1', 'Active', 'DX.One', 'RetailCap', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('60C1366754011', 'Active', 'Hays', 'Hiyundai - Kia', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('LVM2025001', 'Active', 'LVM', 'KAL Beratung', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('LVM2024001', 'Finished', 'LVM', 'KAL Beratung', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('MAN2024004', 'Active', 'MAN', 'MAN erWin', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('MWG2024001', 'Active', 'Müller Weber', 'Infrastructure Assessment', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('PUE2024001', 'Finished', 'Public Experts / KDO', 'Kubernetes Workshop', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('RHB2023004', 'Active', 'Rheinbahn', 'Logging & Monitoring', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('RHB2023003', 'Active', 'Rheinbahn', 'Dokumente & Richtlinien', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('SWZ2024001', 'Active', 'Schwarzt GmbH', 'Digitalstrategie', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('SKF2024001', 'Active', 'SKF', 'Beratungsförderung Transformationsagentur', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('SON2025001MeinSoVDQ1', 'Active', 'SoVD', 'SoVD App', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('VWG2025004', 'Active', 'Volkswagen', 'Integration', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('VWG2025003SERMI', 'Active', 'Volkswagen', 'VW-SERMI', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('VWG2025005WISEq12025', 'Active', 'Volkswagen', 'WISE', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('VWG2025002GSSnilsFuchs', 'Active', 'Volkswagen', 'GSS - Diagnose Cluster', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('VWG2025007', 'Active', 'Volkswagen', 'Application Management', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('VWG2025001ElsaProMigrQ1', 'Active', 'Volkswagen AG', 'ElsaPro Migration ins GRP', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('VWG2025006', 'Active', 'Volkswagen AG', 'GSA Support', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('VWFS2025001', 'Active', 'Volkswagen Bank GmbH', 'IDV-Ablösestrategie', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('WEF2025001', 'Finished', 'Welfenakademie', 'Vorlesung Consulting', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad'),
('ZEG202500', 'Active', 'zw-engeneering GmbH', 'QM-Beratun', '2023-01-15', '2023-06-30', '03f0587b-82a3-41e9-978b-19c0649dd6ad');