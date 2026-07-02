export enum AttendanceStatusDto {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  HALF_DAY = 'HALF_DAY',
  WORK_FROM_HOME = 'WORK_FROM_HOME',
  HOLIDAY = 'HOLIDAY',
  LEAVE = 'LEAVE',
}

export enum AttendanceSourceDto {
  SELF = 'SELF',
  MANUAL = 'MANUAL',
  BIOMETRIC = 'BIOMETRIC',
  IMPORT = 'IMPORT',
}
