import { Component, OnInit } from '@angular/core';
import { EmitirService } from 'src/app/services/emitir.service';
import * as XLSX from 'xlsx';
import * as FileSaver from 'file-saver';
import * as JSZip from 'jszip';
import { IDetail, IClient, ITax, IAdditional, ICondition } from 'src/app/models/invoice.interface';

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

  filename = '';

  constructor(
    private emitirSrv: EmitirService
  ) { }

  ngOnInit() {
  }

  getFile(e: any): void {
    if (e.target.files.length > 0) {
      const regexExcel = /^.*\.(xls|XLS|xlsx|XLSX|csv|CSV|xl|XL|xla|XLA|xlb|XLB|xlc|XLC|xld|XLD|xlk|XLK|xll|XLL|xlm|XLM|xlsb|XLSB|xlshtml|XLSHTML|xlsm|XLSM|xlt|XLT|xlv|XLV|xlw|XLW)$/;
      const filenameTemp = e.target.files[0].name;
      this.filename = filenameTemp.substring(0, filenameTemp.indexOf('.'));
      const ext = filenameTemp.split('.').pop();
      // si es excel
      if (regexExcel.test(`.${ext.toString()}`)) {

        this.isActive = true;

        // archivo xlsx
        this.readXLSX(e.target);
      }
    }
  }


  private readXLSX(dataDoc: any): void {
    const target: DataTransfer = <DataTransfer>(dataDoc);
    if (target.files.length !== 1) { throw new Error('Cannot use multiple files'); }
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

    dataXlsx.map(data => {
      if (data.length) {
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

          // asignar correlativo

          const client: IClient = {
            typeID: 'RUC',
            numID: Number(data[5]),
            name: data[6].indexOf('&') !== -1 ? data[6].replace(/&/gi, '&amp;') : data[6],
            address: data[7].indexOf('&') !== -1 ? data[7].replace(/&/gi, '&amp;') : data[7],
            email: data[21]
          };

          const condition: ICondition = {
            issueDate: new Date().toJSON().slice(0, 10),
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
            client,
            condition,
            tax,
            detail: [],
            additional
          };

          json.detail.push(detail);
          this.currentCorrelativo = correlativoExcel;
          this.excelVouchers.push(json);
          this.i++;

        }

      }

    });

    console.log(this.excelVouchers);

    // habilitar btnEmitir
    this.isActive = false;
  }


  emitir() {
    const arrDownload = [];
    this.excelVouchers.map((elem, i) => {
      const file = this.buildXML(elem);
      const filename = `F001-${i}.xml`;
      const bb = new Blob([file], { type: 'text/plain' });
      arrDownload.push({ file: bb, filename });
    });
    this.saveFiles(arrDownload);
  }



  private buildXML(e: any) {
    const init = this.emitirSrv.getScriptInit();
    const voucher = this.emitirSrv.getScriptVoucher(1);
    const party = this.emitirSrv.getScriptParty();
    const client = this.emitirSrv.getScriptClient(e.client);
    const conditions = this.emitirSrv.getScriptConditions(e.condition);
    const detail = this.emitirSrv.getScriptDetail(e.detail)
    const tax = this.emitirSrv.getScriptTax(e.tax);
    const additional = this.emitirSrv.getScriptAdditional(e.additional);
    const final = this.emitirSrv.getScriptFinal();
    return `${init}${voucher}${party}${client}${conditions}${detail}${tax}${additional}${final}`;
  }


  // script

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

  private downloadFilesXML(arrData: any[]) {
    const containerFiles = [];
    arrData.map((elem: any) => {
      const file = this.buildXML(elem);
      const filename = `${elem.comprobante.serie}-${elem.comprobante.correlativo}.xml`;
      const bb = new Blob([file], { type: 'text/plain' });
      containerFiles.push({ file: bb, filename });
    });
    this.saveFiles(containerFiles);
  }


}
