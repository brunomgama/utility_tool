export interface TimeOffType {
    type: string
    attributes: {
        id: number
        name: string
        category: string
    }
}

export interface EmployeeAttribute {
    label: string
    value: string
    type: string
    universal_id: string
}

export interface Employee {
    type: string
    attributes: {
        id: EmployeeAttribute
        first_name: EmployeeAttribute
        last_name: EmployeeAttribute
        email: EmployeeAttribute
    }
}

export interface Certificate {
    status: string
}

export interface TimeOffPeriodAttributes {
    id: number
    id_v2: string
    status: string
    comment: string
    start_date: string
    end_date: string
    days_count: number
    half_day_start: number
    half_day_end: number
    time_off_type: TimeOffType
    employee: Employee
    created_by: string
    certificate: Certificate
    created_at: string
    updated_at: string
}

export interface TimeOffPeriod {
    type: string
    attributes: TimeOffPeriodAttributes
}

export interface VacationData {
    success: boolean
    data: TimeOffPeriod[]
}

