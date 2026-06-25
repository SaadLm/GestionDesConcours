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
    email: 'local@competition.com',
    password: 'local123',
    description: 'Compte pour test de gestion locale du Centre de Casablanca.'
  },
  global: {
    profile: 'Gestionnaire global',
    email: 'global@competition.com',
    password: 'global123',
    description: 'Compte pour test de supervision globale.'
  },
  admin: {
    profile: 'Administrateur',
    email: 'admin@competition.com',
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
