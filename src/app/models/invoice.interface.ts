export interface IClient {
  typeID: string;
  numID: number;
  name: string;
  address: string;
  email: string;
}

export interface ICondition {
  issueDate: string;
  currency: string;
}

export interface IAdditional {
  dueDate: string;
}

export interface ITax {
  globalDiscount: number;
  gravadas: number;
  exoneradas: number;
  inafectas: number;
  gratuitas: number;
  igvRate: number;
  igvValue: number;
  taxAmount: number;
}

export interface IDetail {
  measurement: string;
  count: number;
  code: string;
  description: string;
  unitValue: number;
  unitPrice: number;
  igvAmount: number;
  igvType: string;
  itemValue: number;
}
