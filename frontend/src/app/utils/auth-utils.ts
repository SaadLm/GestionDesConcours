import { RoleType } from '../models/models';

export interface TestAccount {
  profile: RoleType;
  email: string;
  password: string;
  description: string;
}

export const TEST_ACCOUNTS: Record<string, TestAccount> = {
  local: {
    profile: 'Gestionnaire local',
    email: 'local@test.gov',
    password: 'local123',
    description: 'Compte pour test de gestion locale du centre.'
  },
  global: {
    profile: 'Gestionnaire global',
    email: 'global@test.gov',
    password: 'global123',
    description: 'Compte pour test de supervision globale.'
  },
  admin: {
    profile: 'Administrateur',
    email: 'admin@test.gov',
    password: 'admin123',
    description: 'Compte pour test d’administration complète.'
  }
};

export function authenticateTestAccount(email: string, password: string): TestAccount | undefined {
  return Object.values(TEST_ACCOUNTS).find(
    (account) => account.email === email && account.password === password
  );
}

export function getTestAccountByKey(key: string): TestAccount | undefined {
  return TEST_ACCOUNTS[key];
}
