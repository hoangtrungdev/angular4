import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DetailRoutingModule } from './detail-routing.module';
import { DetailComponent } from './detail.component';
import { LoadingComponent } from '../../shared';


@NgModule({
  imports: [
    CommonModule,
    DetailRoutingModule
  ],
  declarations: [
      DetailComponent,
      LoadingComponent
  ]
})
export class DetailModule { }
