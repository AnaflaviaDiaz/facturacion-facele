import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { ICondition, IClient, IAdditional, ITax, IDetail } from '../models/invoice.interface';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class EmitirService {

  readonly facele = environment.facele;
  readonly demo = environment.endPointDemo;
  readonly prod = environment.endPointProd;
  readonly cors = environment.cors;

  constructor(
    private http: HttpClient
  ) { }

  getCurrentDate() {
    const temp = new Date().toLocaleString("en-US", {timeZone: "America/Lima"}).slice(0, 10);
    return `${temp.slice(6,10)}-${temp.slice(0,2)}-${temp.slice(3,5)}`;
  }

  getScriptInit() {
    return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Comprobante xmlns="http://facele.pe/docele/schemas/v10/Comprobante"><cpe>`;
  }

  getScriptVoucher(correlativo: number) {
    return `<tipoComprobante>${this.facele.tipoComprobante}</tipoComprobante><serie>${this.facele.serie}</serie><correlativo>${correlativo}</correlativo>`;
  }

  getScriptParty() {
    return `<emisor><ruc>${this.facele.ruc}</ruc><razonSocial>${this.facele.razonSocial}</razonSocial><nombreComercial>${this.facele.razonSocial}</nombreComercial><domicilioFiscal><ubigeo>${this.facele.ubigeo}</ubigeo><direccionCompleta>${this.facele.direccionCompleta}</direccionCompleta><urbanizacion>-</urbanizacion><departamento>${this.facele.departamento}</departamento><provincia>${this.facele.provincia}</provincia><distrito>${this.facele.distrito}</distrito></domicilioFiscal></emisor>`;
  }

  getScriptClient(a: IClient) {
    return `<adquiriente><tipoIdentificacion>${a.typeID}</tipoIdentificacion><numeroIdentificacion>${a.numID}</numeroIdentificacion><nombre>${a.name}</nombre><direccionFisica>${a.address}</direccionFisica><email>${a.email}</email></adquiriente>`;
  }

  getScriptConditions(c: ICondition) {
    return `<condiciones><fechaEmision>${c.issueDate}</fechaEmision><moneda>${c.currency}</moneda></condiciones>`;
  }

  getScriptDetail(det: any[]) {
    let script = '';
    det.map((d: IDetail) => {
      script += `<detalle><unidadMedida>${d.measurement}</unidadMedida><cantidadUnidades>${d.count}</cantidadUnidades><codigo>${d.code}</codigo><descripcion>${d.description}</descripcion><valorUnitario>${d.unitValue}</valorUnitario><precioUnitario>${d.unitPrice}</precioUnitario><IgvMonto>${d.igvAmount}</IgvMonto><IgvTipo>${d.igvType}</IgvTipo><valorItem>${d.itemValue}</valorItem></detalle>`;
    });
    return script;
  }

  getScriptTax(t: ITax) {
    return `<totales><valorDescuentoGlobal>${t.globalDiscount}</valorDescuentoGlobal><valorOperacionesGravadas>${t.gravadas}</valorOperacionesGravadas><valorOperacionesExoneradas>${t.exoneradas}</valorOperacionesExoneradas><valorOperacionesInafectas>${t.inafectas}</valorOperacionesInafectas><valorOperacionesGratuitas>${t.gratuitas}</valorOperacionesGratuitas><tasaIgv>${t.igvRate}</tasaIgv><valorIgv>${t.igvValue}</valorIgv><importeTotal>${t.taxAmount}</importeTotal></totales>`;
  }

  getScriptAdditional(a: IAdditional) {
    return `<observacionAdicional><nombre>fechaVencimiento</nombre><contenido>${a.dueDate}</contenido></observacionAdicional>`;
  }

  getScriptFinal() {
    return `</cpe></Comprobante>`;
  }

  // 0: '01' -> factura
  // 1: number de lista excel
  // 2: string fecha de vencimiento
  // 3: string currency

  // 4: string '6' ref RUC
  // 5: number RUC client
  // 6: string razonS Client
  // 7: string address Client

  // 8: string code (codigo) item
  // 9: number count (cantidadUnidades) item
  // 10: string measurement (unidadMedida) item
  // 11: string description (descripcion) item
  // 12: number valor sin igv (valorUnitario) item
  // 13: number valor con igv (precioUnitario) item
  // 14: string o number ref operacion onerosa gravada (IgvTipo) item
  // 15: number igv monto (IgvMonto) item
  // 16: number (valorItem) item 

  // 17: number(gravadas) totales
  // 18: number (tasaIgv) 0.18
  // 19: number (valorIgv) valor impuesto
  // 20: number (importeTotal)

  // 21: number (email)

  emitir(method: string, body: any, isProd: boolean) {
    let headers = new HttpHeaders();
    headers = headers.append('Content-Type', 'application/json');
    const script = JSON.stringify(body);
    return this.http.post(`${this.cors}${isProd ? this.prod : this.demo}${method}`, script, { headers });
  }

}
