export interface UserMutation {
  firstName?: string;
  lastName?: string;
  email?: string;
  document?: string;
  phone?: string;
  gender?: string;
  birthDate?: string;
  corporateName?: string;
  corporateDocument?: string;
  stateRegistration?: string;
  isCorporate?: boolean;
}

export interface AddressMutation {
  addressName?: string;
  addressType?: string;
  postalCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  country?: string;
  receiverName?: string;
  reference?: string;
}
