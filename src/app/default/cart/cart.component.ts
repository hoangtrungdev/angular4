import { Component, OnInit } from '@angular/core';
import { routerTransition } from '../../router.animations';
import {ToasterService} from 'angular2-toaster';
import { AngularFireDatabase } from 'angularfire2/database';
import * as _ from 'lodash';

@Component({
    selector: 'app-cart',
    templateUrl: './cart.component.html',
    styleUrls: ['./cart.component.scss'],
    animations: [routerTransition()]

})
export class CartComponent implements OnInit {
    public db : any ;
    public cartArray : any = [] ;
    public cartCoupon : any = null ;
    public couponStep = 'quest';
    public couponText = '';
    public couponErrorMessage = '';
    public step = 'step1';
    public fee = 0;
    public customerPhone : any  = '';
    public customerInfo : any  = {};
    public cityArray : any = [];
    public districtArray : any  = [];
    public townArray : any  = [];
    public customerArray : any  = [];
    public currentInfo : any = {
        city : {} ,
        district : {} ,
        town : {}
    };

    private toasterService: ToasterService;

    constructor(toasterService: ToasterService, db: AngularFireDatabase) {
        this.db = db ;
        this.toasterService = toasterService;
        if(localStorage.getItem('cartInfo'))
            this.cartArray = JSON.parse(localStorage.getItem('cartInfo'));
        if(localStorage.getItem('customerPhone'))
            this.customerPhone = localStorage.getItem('customerPhone');
        if(localStorage.getItem('cartCoupon')){
            this.cartCoupon = JSON.parse(localStorage.getItem('cartCoupon'));
            this.couponStep = 'final';
        }

        // load cities
        this.cityArray = db.list('/city');
        this.districtArray = db.list('/district');
        this.townArray = db.list('/town');
        this.customerArray = db.list('/customers');
    }

    ngOnInit() {
    }
    public resetCoupon() {
        this.cartCoupon = null ;
        this.couponStep = 'input';
        localStorage.removeItem('cartCoupon');
    }
    public checkCoupon() {
        if (!this.couponText) {
            this.couponErrorMessage = 'Vui lòng nhập mã giảm giá.'
        } else {
            this.db.list('/coupons',{
                preserveSnapshot: true,
                query: {
                    orderByChild: 'code',
                    equalTo: this.couponText
                }
            }).subscribe(items => {
               if(items && items.length > 0 && items[0]) {
                   let couponDetail = items[0].val();
                   couponDetail.keyCoupon = items[0].key;
                   if (couponDetail.status == 'enable') {
                       if (_.includes(_.map(this.cartArray, 'pid'), couponDetail.pid)) {
                           this.couponErrorMessage = '';
                           this.cartCoupon = couponDetail ;
                           localStorage.setItem('cartCoupon', JSON.stringify(this.cartCoupon));
                           this.couponStep = 'final';
                           this.toasterService.pop('success', 'Thông báo !', 'Nhập mã giảm giá thành công .');
                       } else {
                           this.couponErrorMessage = 'Rất tiếc, mã giảm giá này không áp dụng cho sản phẩm bạn chọn.'
                       }
                   } else {
                       this.couponErrorMessage = 'Rất tiếc, mã giảm giá này đã được sử dụng.'
                   }


               } else {
                   this.couponErrorMessage = 'Mã giảm giá không tồn tại. Vui lòng nhập lại mã giảm giá.'
               }
            });
        }
    }

    public getTotalCart(array) {
        let totalObj = {
            price : 0 ,
            sale_price : 0 ,
            promotion_price : 0
        };
        array.map( item => {
            totalObj.price += item.quantity * item.price;
            totalObj.sale_price += item.quantity * item.sale_price;
            totalObj.promotion_price += item.quantity * (item.price - item.sale_price);
        })
        return totalObj;
    }

    public deleteCartItem(index) {
        this.cartArray.splice(index , 1);
        localStorage.setItem('cartInfo', JSON.stringify(this.cartArray));
    }
    public changeQuantityCartItem(item, value) {
        if( value == -1 && item.quantity == 1) {

        } else {
            item.quantity  += value ;
        }
        localStorage.setItem('cartInfo', JSON.stringify(this.cartArray));
    }
    public nextStep(step) {
        switch(step) {
            case 'step1': {
                this.step = 'step2';
                break;
            }
            case 'step2': {
                if( this.checkPhoneNumber( this.customerPhone ) && this.customerPhone != ''){
                    this.step = 'step3';
                    localStorage.setItem('customerPhone', this.customerPhone);
                    this.toasterService.pop('success', 'Thông báo !', 'Nhập số điện thoại thành công .');
                    this.customerInfo = {
                        address : '' ,
                        name : '' ,
                        district : '' ,
                        town : '' ,
                        city : ''
                    }
                    this.db.list('/customers',{
                        query: {
                            orderByChild: 'phone',
                            equalTo: this.customerPhone
                        }
                    }).subscribe(items => {
                        items.map( cus => {
                            if ( cus.phone == this.customerPhone) {
                                this.customerInfo = {
                                    hasHistory : true ,
                                    address : cus.address ,
                                    name : cus.name ,
                                    district : cus.district ,
                                    town : cus.town ,
                                    city : cus.city
                                }
                                this.changeCity(cus.city);
                                this.changeDistrict(cus.district);
                                this.changeTown(cus.town);
                            }
                        })
                    });

                }else {
                    this.toasterService.pop('error', 'Thông báo !', 'Vui lòng nhập số điện thoại đúng định dạng .');
                }
                break;
            }
            case 'step3': {
                if( this.customerInfo.name != '' && this.customerInfo.address != '' && this.customerInfo.city != '' && this.customerInfo.city != '' && this.customerInfo.city != ''){
                    this.step = 'step4';
                }else {
                    this.toasterService.pop('error', 'Thông báo !', 'Vui lòng nhập đầy đủ thông tin .');
                }
                break;
            }
            case 'step4': {
                let arrayCartSave =[] ;
                this.cartArray.map(item => {
                    arrayCartSave.push({
                        "code": item.pid,
                        "id": item.pid,
                        "avatar": item.avatar,
                        "saleoff": '1',
                        "normal_price": item.price,
                        "sale_price": item.sale_price,
                        "quantity": item.quantity
                    })
                });
                this.db.list('newOrder').push({
                    itemsincart: JSON.stringify(arrayCartSave),
                    totalcal: this.getTotalCart(this.cartArray).price,
                    discount: this.getTotalCart(this.cartArray).promotion_price,
                    coupon : this.cartCoupon,
                    customer_name: this.customerInfo.name,
                    customer_address: this.customerInfo.address,
                    customer_phone: this.customerPhone,
                    fee: this.fee,
                    city: this.customerInfo.city,
                    district: this.customerInfo.district,
                    town: this.customerInfo.town,
                    handle: 0,
                    startedAt: new Date().getTime()
                });
                this.step = 'final';

                // reset value
                this.cartArray = [] ;
                localStorage.setItem('cartInfo', JSON.stringify(this.cartArray));
                this.fee = 0;
                this.customerPhone  = '';
                this.customerInfo  = {};
                this.currentInfo = {
                    city : {} ,
                    district : {} ,
                    town : {}
                };
                this.toasterService.pop('success', 'Thông báo !', 'Đặt hàng thành công .');
                //reset coupon
                let seft = this ;
                this.db.object('/coupons/'+ this.cartCoupon.keyCoupon).update({
                    status : 'used'
                }).then(function () {
                    seft.resetCoupon();
                });
                break;
            }
            default: {
                this.step = 'step1' ;
                break;
            }
        }
    }
    public prevStep(step) {
        switch(step) {
            case 'step2': {
                this.step = 'step1';
                break;
            }
            case 'step3': {
                this.step = 'step2';
                break;
            }
            case 'step4': {
                this.step = 'step3';
                break;
            }
            default: {
                this.step = 'step1' ;
                break;
            }
        }
    }

    // check phonenumber
    private checkPhoneNumber(value) {
        let phoneno = /^([0-9]{10,11})$/;
        if(value.match(phoneno)) {
            return true;
        }
        else {
            return false;
        }
    }
    public changeDistrict(district){
        this.db.object('/district/'+district).subscribe(item => {
            this.currentInfo.district = item ;
            this.fee  = +item.fee;
            this.townArray = this.db.list('town',{
                query: {
                    orderByChild: 'district',
                    equalTo: district
                }
            })
        })

    }
    public changeCity(city){
        this.db.object('/city/'+city).subscribe(item => {
            this.currentInfo.city = item ;
        })

    }
    public changeTown(town){
        this.db.object('/town/'+town).subscribe(item => {
            this.currentInfo.town = item ;
        })

    }

}
