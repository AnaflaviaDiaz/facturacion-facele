import { Component, OnInit } from '@angular/core';
import { EmitirService } from 'src/app/services/emitir.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import * as JSZip from 'jszip';
import { IDetail, IClient, ITax, IAdditional, ICondition, IConsultar, IDeclarar, IVoucher } from 'src/app/models/invoice.interface';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-form-excel',
  templateUrl: './form-excel.component.html',
  styleUrls: ['./form-excel.component.css']
})
export class FormExcelComponent implements OnInit {

  excelVouchers: Array<any> = [];
  currentCorrelativo = 0;
  i = 0;
  isActive = true;
  lastCorrelativo = 0;
  filename = '';
  facData = environment.facele;
  isProduccion: boolean = false;

  constructor(
    private emitirSrv: EmitirService
  ) { }

  ngOnInit() {
    this.getCorrelativos('consultar');
  }

  toggle() {
    this.clear();
    this.isProduccion = !this.isProduccion;
    this.getCorrelativos('consultar');
  }

  private getCorrelativos(method: string) {
    const body: IConsultar = {
      rucEmisor: this.facData.ruc,
      tipoDocumento: '01',
      serie: this.facData.serie
    }

    this.emitirSrv.emitir(method, body, this.isProduccion)
      .subscribe((data: any) => {
        this.lastCorrelativo = Number(Object.values(data.return.registros).map((elem: any) => elem.correlativo).sort((a, b) => b - a)[0]);
        console.log(this.lastCorrelativo);
      }, err => console.log(err));
  }

  private clear() {
    this.i = 0;
    this.excelVouchers.length = 0;
    this.isActive = true;
    this.currentCorrelativo = 0;
  }

  private readXLSX(dataDoc: any): void {
    const target: DataTransfer = <DataTransfer>(dataDoc);
    if (target.files.length !== 1) { throw new Error('No se puede usar multiples archivos'); }
    const reader: FileReader = new FileReader();
    reader.onload = (e: any) => {
      const bstr: string = e.target.result;
      const wb: XLSX.WorkBook = XLSX.read(bstr, { type: 'binary' });
      const wsname: string = wb.SheetNames[0];
      const ws: XLSX.WorkSheet = wb.Sheets[wsname];
      const dataXLSX = XLSX.utils.sheet_to_json(ws, { header: 1 });

      // cortando 2 primeras celdas
      this.buildBody(dataXLSX.slice(2));
    };
    reader.readAsBinaryString(target.files[0]);
  }

  private buildBody(dataXlsx: Array<any> = []) {

    dataXlsx.map((data) => {
      if (data.length > 0) {

        const correlativoExcel = Number(data[1]);

        if (correlativoExcel === this.currentCorrelativo) {

          const detail: IDetail = {
            code: data[8],
            count: 1,
            measurement: 'ZZ',
            description: data[11].indexOf('&') !== -1 ? data[11].replace(/&/gi, '&amp;') : data[11],
            unitValue: data[12],
            unitPrice: data[13],
            igvType: 'GRAVADO_OPERACION_ONEROSA',
            igvAmount: data[15],
            itemValue: data[16]
          };

          this.excelVouchers[this.i - 1].detail.push(detail);

        } else {

          this.lastCorrelativo++;

          const correlativo = this.lastCorrelativo;

          const client: IClient = {
            typeID: 'RUC',
            numID: Number(data[5]),
            name: data[6].indexOf('&') !== -1 ? data[6].trim().replace(/&/gi, '&amp;') : data[6].trim(),
            address: data[7].indexOf('&') !== -1 ? data[7].trim().replace(/&/gi, '&amp;') : data[7].trim(),
            email: data[21]
          };

          const condition: ICondition = {
            issueDate: this.emitirSrv.getCurrentDate(),
            currency: data[3].trim()
          };

          const tax: ITax = {
            globalDiscount: 0,
            gravadas: Number(data[17]),
            exoneradas: 0,
            inafectas: 0,
            gratuitas: 0,
            igvRate: Number(data[18]),
            igvValue: Number(data[19]),
            taxAmount: Number(data[20])
          };

          const additional: IAdditional = {
            dueDate: data[2]
          }

          const detail: IDetail = {
            code: data[8],
            count: 1,
            measurement: 'ZZ',
            description: data[11].indexOf('&') !== -1 ? data[11].replace(/&/gi, '&amp;') : data[11],
            unitValue: data[12],
            unitPrice: data[13],
            igvType: 'GRAVADO_OPERACION_ONEROSA',
            igvAmount: data[15],
            itemValue: data[16]
          };

          const json = {
            correlativo,
            client,
            condition,
            tax,
            detail: [],
            additional,
            statusDol: ''
          };

          json.detail.push(detail);
          this.currentCorrelativo = correlativoExcel;
          this.excelVouchers.push(json);
          this.i++;

        }
      }
    });

    // habilitar btnEmitir
    this.isActive = false;
  }

  private buildXML(e: any) {
    const init = this.emitirSrv.getScriptInit();
    const voucher = this.emitirSrv.getScriptVoucher(e.correlativo);
    const party = this.emitirSrv.getScriptParty();
    const client = this.emitirSrv.getScriptClient(e.client);
    const conditions = this.emitirSrv.getScriptConditions(e.condition);
    const detail = this.emitirSrv.getScriptDetail(e.detail)
    const tax = this.emitirSrv.getScriptTax(e.tax);
    const additional = this.emitirSrv.getScriptAdditional(e.additional);
    const final = this.emitirSrv.getScriptFinal();
    return `${init}${voucher}${party}${client}${conditions}${detail}${tax}${additional}${final}`;
  }

  private saveFiles(arr: any[]) {
    const zip = new JSZip();
    const filename = this.filename;
    for (let i = 0; i < arr.length; i++) {
      zip.folder(filename).file(arr[i].filename, arr[i].file);
      if (i === arr.length - 1) {
        zip.generateAsync({ type: 'blob' })
          .then(function (content) {
            FileSaver.saveAs(content, `${filename}.zip`);
          });
      }
    }
  }

  getFile(e: any): void {
    if (e.target.files.length > 0) {
      const regexExcel = /^.*\.(xls|XLS|xlsx|XLSX|csv|CSV|xl|XL|xla|XLA|xlb|XLB|xlc|XLC|xld|XLD|xlk|XLK|xll|XLL|xlm|XLM|xlsb|XLSB|xlshtml|XLSHTML|xlsm|XLSM|xlt|XLT|xlv|XLV|xlw|XLW)$/;
      const filenameTemp = e.target.files[0].name;
      this.filename = filenameTemp.substring(0, filenameTemp.indexOf('.'));
      const ext = filenameTemp.split('.').pop();
      // si es excel
      if (regexExcel.test(`.${ext.toString()}`)) {

        this.clear();
        // archivo xlsx
        this.readXLSX(e.target);
      }
    }
  }

  emitir(method: string) {

    // emitir a ambiente **************************
    this.excelVouchers.map((elem, i) => {
      const body: IDeclarar = {
        rucEmisor: this.facData.ruc,
        tipoDocumento: '01',
        formato: 'XMLv10',
        documento: this.buildXML(elem)
      };

      this.emitirSrv.emitir(method, body, this.isProduccion)
        .subscribe((data: any) => {
          console.log(data);
          this.assingStatus(data, i);
        }, err => console.log(err));
    });
    // emitir a ambiente **************************

    // descargar archivos **************************
    const arrDownload = [];
    this.excelVouchers.map((elem, i) => {
      const file = this.buildXML(elem);
      const filename = `F001-${elem.correlativo}.xml`;
      const bb = new Blob([file], { type: 'text/plain' });
      arrDownload.push({ file: bb, filename });
    });

    this.saveFiles(arrDownload);
    // descargar archivos **************************

    this.isActive = true;
  }

  private assingStatus(data: any, i: number) {
    let description: string;

    if (data.status === 400) {
      description = data.error.return.respuesta.descripcion;
      if (description !== 'El comprobante ya existe') {
        description = `No procesado debido a : ${description}`;
      }
    } else if (data.status === 0) {
      description = 'Error de Emisión';
    } else if (data.status === 200) {
      description = data.return.respuesta.descripcion;
    } else {
      description = data.return.respuesta.descripcion;
    }

    if (description === '' || description === undefined) { description = 'Error de Emisión'; }
    this.excelVouchers[i].statusDOL = description;
  }


}
