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
