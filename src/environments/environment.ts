// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  facele: {
    serie: 'F001',
    tipoComprobante: 'FACTURA',
    ruc: '20601122406',
    razonSocial: 'FACELE SAC',
    ubigeo: 150122,
    direccionCompleta: 'CALLE ENRIQUE MEIGGS NRO. 199 DPTO. 401',
    departamento: 'Lima',
    provincia: 'Lima',
    distrito: 'Miraflores'
  },
  endPoint: 'https://demo.docele.pe/doceleol-rest/rest/',
  cors: 'https://cors-anywhere.herokuapp.com/'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
