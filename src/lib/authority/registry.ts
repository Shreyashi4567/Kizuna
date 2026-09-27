import { AuthorityRecord } from '@/types';

/**
 * Statutory Government Road Authorities Registry.
 * Maps administrative levels (Central, State, Municipal, Panchayat)
 * and road categories to official jurisdictional departments.
 */
export const AUTHORITY_REGISTRY: AuthorityRecord[] = [
  {
    id: 'NHAI_RO_CG',
    authorityName: 'National Highways Authority of India (NHAI)',
    department: 'Ministry of Road Transport and Highways (MoRTH)',
    level: 'Central',
    state: 'Chhattisgarh',
    district: 'Raipur',
    jurisdiction: 'National Highway corridors NH-30, NH-53, NH-130 and expressways traversing Chhattisgarh.',
    roadCategories: ['national_highway'],
    contactEmail: 'ro-raipur@nhai.org',
    portalUserId: 'officer_nhai_raipur',
    escalationAuthority: 'Regional Office NHAI, Chhattisgarh Zone',
    active: true,
    isDemo: false,
  },
  {
    id: 'CG_PWD_DIV1',
    authorityName: 'Chhattisgarh Public Works Department (State Highways & District Division)',
    department: 'Public Works Department, Govt. of Chhattisgarh',
    level: 'State',
    state: 'Chhattisgarh',
    district: 'Raipur',
    jurisdiction: 'State Highways (SH-1 to SH-22) and Major District Roads (MDR) under Raipur & adjoining divisions.',
    roadCategories: ['state_highway', 'district_road'],
    contactEmail: 'ee-pwd-sh-raipur@cg.gov.in',
    portalUserId: 'officer_pwd_sh',
    escalationAuthority: 'Chief Engineer (State Highways), CG PWD',
    active: true,
    isDemo: false,
  },
  {
    id: 'RMC_CIVIL',
    authorityName: 'Raipur Municipal Corporation (Engineering Department)',
    department: 'Urban Administration & Development Department, Chhattisgarh',
    level: 'Municipal',
    state: 'Chhattisgarh',
    district: 'Raipur',
    jurisdiction: 'Urban arterial roads, colony streets, flyover approaches within urban municipal limits.',
    roadCategories: ['municipal_road', 'other'],
    contactEmail: 'commissioner-works@raipurcorporation.com',
    portalUserId: 'officer_rmc_civil',
    escalationAuthority: 'Urban Administration & Development Dept, Chhattisgarh',
    active: true,
    isDemo: false,
  },
  {
    id: 'CG_RRDA_PMGSY',
    authorityName: 'Chhattisgarh Rural Road Development Agency (PMGSY PIU)',
    department: 'Panchayat & Rural Development Department, Chhattisgarh',
    level: 'Panchayat',
    state: 'Chhattisgarh',
    district: 'Raipur',
    jurisdiction: 'Pradhan Mantri Gram Sadak Yojana (PMGSY) rural connectivity corridors connecting habitations.',
    roadCategories: ['rural_road', 'village_internal_road'],
    contactEmail: 'piu-cgrrda-raipur@pmgsy.nic.in',
    portalUserId: 'officer_pmgsy_raipur',
    escalationAuthority: 'Chief Executive Officer, CGRRDA Raipur',
    active: true,
    isDemo: false,
  },
];

// Alias for backwards compatibility
export const DEMO_AUTHORITY_REGISTRY = AUTHORITY_REGISTRY;
