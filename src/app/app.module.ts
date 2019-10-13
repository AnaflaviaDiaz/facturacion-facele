import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { RedactarComponent } from './views/redactar/redactar.component';
import { FormExcelComponent } from './components/form-excel/form-excel.component';
import { TableDetailComponent } from './components/table-detail/table-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    RedactarComponent,
    FormExcelComponent,
    TableDetailComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
