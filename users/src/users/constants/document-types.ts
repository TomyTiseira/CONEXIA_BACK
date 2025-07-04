export const DOCUMENT_TYPES = {
  DNI: 'DNI',
  TI: 'Tarjeta de Identidad',
  PAS: 'Pasaporte',
  CE: 'Cédula de Extranjería',
  OTHER: 'Otro',
};

export const DOCUMENT_TYPES_LIST = [
  { name: DOCUMENT_TYPES.DNI, description: 'Documento Nacional de Identidad' },
  {
    name: DOCUMENT_TYPES.TI,
    description: 'Documento de identidad para menores',
  },
  { name: DOCUMENT_TYPES.PAS, description: 'Documento de viaje internacional' },
  { name: DOCUMENT_TYPES.CE, description: 'Documento para extranjeros' },
  { name: DOCUMENT_TYPES.OTHER, description: 'Otro tipo de documento' },
];
