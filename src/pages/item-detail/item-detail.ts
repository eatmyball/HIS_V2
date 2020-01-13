/*
  Description: 申请单详情页面
  Author: ZhuChenjie
  Create Date: 2017-05-04
 */

import {Component} from '@angular/core';
import {
    NavController,
    NavParams,
    ViewController,
    AlertController,
    LoadingController,
    ModalController
} from 'ionic-angular';
import {Service} from "../../providers/piservice/service";
import {ItempopoverPage} from '../itempopover/itempopover';

import {NgZone} from '@angular/core';
import {ZBar, ZBarOptions} from "@ionic-native/zbar";

/*
 Generated class for the ItemDetail page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */

const STATUS_DISPATCHED: string = '派工';
const STATUS_RECEIVED: string = '已接受';
const STATUS_STARTED:string = '已开始';
const STATUS_COMPLETED: string = '完工';

const BTN_TEXT_RECEIVE: string = '接受派工';
const BTN_TEXT_RECEIVE_MANUAL: string = '手工接受';
const BTN_TEXT_START:string = '扫码开始';
const BTN_TEXT_COMPLETE: string = '扫码完成';
const BTN_TEXT_COMPLETE_MANUAL: string = '手工完成';
//昆明医院
const DISPATCH_CENTER_CODE: string = '01005A00099';

@Component({
    selector: 'page-item-detail',
    templateUrl: 'item-detail.html'
})
export class ItemDetailPage {
    item;
    index;
    detail;
    // type;
    language;
    rejectText;
    remarkText;
    remarkPlaceholderText;
    ok;
    cancel;
    supplementText;
    delegationText;
    processingText;
    infoText;
    processedText;
    errorText;
    downloadingText;
    noReaderText;
    openErrorText;
    unknownText;

    btn_action_text: string = '';
    btn_action_text_manual: string = '';

    isMultiLocationTask = false;
    //标本运送任务结构
    specimenTransferTask = null;

    //contactsCallback;
    constructor(private zbar: ZBar, public navCtrl: NavController, public navParams: NavParams, public viewCtrl: ViewController, public service: Service, public alertCtrl: AlertController, public loadingCtrl: LoadingController, public modalCtrl: ModalController, public ngZone: NgZone) {
        this.item = this.navParams.get("para");
        this.index = this.navParams.get("index");
        this.detail = this.navParams.get("detail");
        //标本类型，多个目的地科室
        if(this.detail.data.transferType == '标本') {
            this.service.getSpecimenTransferTask(this.item.billNo).then(data=>{
                console.log('Saved data no:'+ this.item.billNo+ ' data:'+ JSON.stringify(data));
                if(data) {
                    this.specimenTransferTask = data;
                }
            }).catch(error=>{
                this.specimenTransferTask = null;
            });
            if(this.specimenTransferTask == null) {
                let fromLocationTaskList = []
                let toLocationTaskList = [];

                if(this.detail.data.toLocationName.indexOf(',') > 0) {
                    
                    let list = this.detail.data.toLocationCode.split(',');
                    let nameList = this.detail.data.toLocationName.split(',');

                    if(list&&list.length > 0) {
                        
                        for(let index in list) {
                            let obj = {};
                            obj['name'] = nameList[index];
                            obj['code'] = list[index];
                            obj['isDone'] = false;
                            toLocationTaskList.push(obj);
                        }
                    }
                    
                }else {
                    let obj = {};
                    obj['name'] = this.detail.data.toLocationName;
                    obj['code'] = this.detail.data.toLocationCode;
                    obj['isDone'] = false;
                    toLocationTaskList.push(obj);
                }

                if(this.detail.data.fromLocationName.indexOf(',') > 0) {
                    let list = this.detail.data.fromLocationCode.split(',');
                    let nameList = this.detail.data.fromLocationName.split(',');

                    if(list&&list.length > 0) {
                        for(let index in list) {
                            let obj = {};
                            obj['name'] = nameList[index];
                            obj['code'] = list[index];
                            obj['isDone'] = false;
                            fromLocationTaskList.push(obj);
                        }
                        
                    }
                }else {
                    let obj = {};
                    obj['name'] = this.detail.data.fromLocationName;
                    obj['code'] = this.detail.data.fromLocationCode;
                    obj['isDone'] = false;
                    fromLocationTaskList.push(obj);
                }
                this.specimenTransferTask = {};
                this.specimenTransferTask['toLocationList'] = toLocationTaskList;
                this.specimenTransferTask['fromLocationList'] = fromLocationTaskList;
                this.service.saveSpecimenTransferTask(this.item.billNo, this.specimenTransferTask);

            }
        }

        console.log(this.index.items);
    }

    ionViewWillEnter() {
        if (this.detail.data.status == STATUS_DISPATCHED) {
            this.btn_action_text = BTN_TEXT_RECEIVE;
        } else if (this.detail.data.status == STATUS_RECEIVED) {
            this.btn_action_text = BTN_TEXT_START;
        }else if (this.detail.data.status == STATUS_STARTED) {
            this.btn_action_text = BTN_TEXT_COMPLETE;
            
        }
    }

    dismiss() {
        this.viewCtrl.dismiss();
    }

    popover(event) {
        event.preventDefault();
        let itemModal = this.modalCtrl.create(ItempopoverPage, {
            label: event.target.closest('h3').childNodes[0].data,
            value: event.target.closest('h3').childNodes[1].innerText
        });
        itemModal.onDidDismiss(data => {
            if (data) {
            }
        });
        itemModal.present();
    }

    isArray(item) {
        return item instanceof Array;
    }

    approve_manual() {
        if (this.detail.data.status == STATUS_DISPATCHED) {
            this.process(this.item, this.index, {note: STATUS_RECEIVED, supp: ''});
        } 
        // else if (this.detail.data.status == STATUS_RECEIVED) {
        //     this.process(this.item, this.index, { note: STATUS_COMPLETED, supp: '' });
        // }
        else {
            return;
        }
    }

    approve() {
        //console.log(this.item.billNo);
        if (this.detail.data.status == STATUS_DISPATCHED) {
            //直接接受任务
            this.process(this.item, this.index, { note: STATUS_RECEIVED, supp: '' });
        }else if(this.detail.data.status == STATUS_RECEIVED) {
            console.log("开始");
            let options: ZBarOptions = {
                text_title: "",
                text_instructions: "请扫描始发科室二维码",
                flash: "auto",
                drawSight: true
            };

            this.zbar.scan(options)
                .then(result => {
                    this.processStarted(result);
                })
                .catch(error => {
                    if (error != "cancelled") {
                        alert(JSON.stringify(error));
                    }
                    console.log(error);
                });
        }else if (this.detail.data.status == STATUS_STARTED) {
                console.log("已接受");
            let options: ZBarOptions = {
                text_title: "",
                text_instructions: "请扫描目的科室二维码",
                flash: "auto",
                drawSight: true
            };

            this.zbar.scan(options).then(result => {
                this.processCompleted(result);
                }).catch(error => {
                    if (error != "cancelled") {
                        alert(JSON.stringify(error));
                    }
                    console.log(error);
                });
            }
            // this.process(this.item, this.index, { note: STATUS_COMPLETED, supp: '' });
    }

    processStarted(result:string) {
        console.log(result);
        if(this.detail.data.transferType == '标本') {
            let isScanSuccess = false;
            //多个始发科室
            // if(this.detail.data.fromLocationName.indexOf(',') > 0) {
                for(let index in this.specimenTransferTask['fromLocationList']) {
                    if(result == this.specimenTransferTask['fromLocationList'][index]['code']) {
                        isScanSuccess = true;
                        if(!this.specimenTransferTask['fromLocationList'][index]['isDone']) {
                            this.specimenTransferTask['fromLocationList'][index]['isDone'] = true;
                            this.service.saveSpecimenTransferTask(this.item.billNo,this.specimenTransferTask);
                        }else {
                            let alert = this.alertCtrl.create({
                                title: "提示",
                                message: "该科室任务已完成，请勿重复扫码",
                                buttons: ["确定"]
                            });
                            alert.present();
                        }
                        
                    }
                }
                if(!isScanSuccess) {
                    let alert = this.alertCtrl.create({
                        title: "提示",
                        message: "请扫描正确的始发科室二维码",
                        buttons: ["确定"]
                    });
                    alert.present();
                }
                //遍历是否都完成
                let isCompleted = true;
                for(let index in this.specimenTransferTask['fromLocationList']) {
                    if(!this.specimenTransferTask['fromLocationList'][index]['isDone']) {
                        isCompleted = false;
                    }
                }
                if(isCompleted) {
                    //扫描全部始发科室后，开始任务
                    this.process(this.item, this.index, {note: STATUS_STARTED, supp: ''});
                }
            
            
        }
        else {
            if (result == this.detail.data.fromLocationCode) {
                this.process(this.item, this.index, {note: STATUS_STARTED, supp: ''});
            } else {
                let alert = this.alertCtrl.create({
                    title: "提示",
                    message: "请扫描正确的始发科室(" + this.detail.data.fromLocationName + ")二维码",
                    buttons: ["确定"]
                });
                alert.present();
            }
        }
    }

    // 完工操作
    processCompleted(result:string) {
        console.log(result);
        if(this.detail.data.transferType == '标本') {
            let isScanSuccess = false;
            //多个目的科室
            // if(this.detail.data.toLocationCode.indexOf(',') > 0) {
                for(let index in this.specimenTransferTask['toLocationList']) {
                    if(result == this.specimenTransferTask['toLocationList'][index]['code']) {
                        isScanSuccess = true;
                        if(!this.specimenTransferTask['toLocationList'][index]['isDone']) {
                            this.specimenTransferTask['toLocationList'][index]['isDone'] = true;
                            this.service.saveSpecimenTransferTask(this.item.billNo,this.specimenTransferTask);
                        }else {
                            let alert = this.alertCtrl.create({
                                title: "提示",
                                message: "该科室任务已完成，请勿重复扫码",
                                buttons: ["确定"]
                            });
                            alert.present();
                        }
                        
                    }
                }

                if(!isScanSuccess) {
                    let alert = this.alertCtrl.create({
                        title: "提示",
                        message: "请扫描正确的目的科室二维码",
                        buttons: ["确定"]
                    });
                    alert.present();
                }
                //遍历是否都完成
                let isCompleted = true;
                for(let index in this.specimenTransferTask['toLocationList']) {
                    if(!this.specimenTransferTask['toLocationList'][index]['isDone']) {
                        isCompleted = false;
                    }
                }
                if(isCompleted) {
                    //运送任务完成
                    this.process(this.item, this.index, { note: STATUS_COMPLETED, supp: '' });
                }
            
            
        }else {
            //目的科室不为空，则扫描目的科室
            if(this.detail.data.toLocationCode) {
                if (result == this.detail.data.toLocationCode) {
                    this.process(this.item, this.index, { note: STATUS_COMPLETED, supp: '' });
                } else {
                    let alert = this.alertCtrl.create({
                        title: "提示",
                        message: "请扫描正确的目的科室(" + this.detail.data.toLocationName + ")二维码",
                        buttons: ["确定"]
                    });
                    alert.present();
                }
            }
            //目的科室为空，扫描调度室code
            else {
                if (result == DISPATCH_CENTER_CODE) {
                    this.process(this.item, this.index, { note: STATUS_COMPLETED, supp: '' });
                } else {
                    let alert = this.alertCtrl.create({
                        title: "提示",
                        message: "请扫描调度中心二维码",
                        buttons: ["确定"]
                    });
                    alert.present();
                }
            }
            
        }
    }

    //强制完成
    forceCompleted() {
        let alert = this.alertCtrl.create({
            title: "提示",
            message: "强制完成标本运送任务，请输入完工备注",
            inputs:[
                {
                    name:'remark',
                    placeholder:'请输入备注'
                }
            ],
            buttons: [{
                text:'取消',
                role:'cancel'
            },
            {
                text:'提交',
                handler: data=>{
                    if(data.remark) {
                        console.log('remark is :' + data.remark);
                        this.process(this.item, this.index, { note: STATUS_COMPLETED, remark: data.remark });
                    }
                }
            }]
        });
        alert.present();
    }
    

    back() {
        //loader.dismiss();
        this.viewCtrl.dismiss();
    }

    process(item, i, data) {
        let loader = this.loadingCtrl.create({
            content: this.processingText,
        });
        loader.present();
        //console.log(item.billNo);
        let remark = data.remark != null? data.remark:'';
        
        this.service.updateTransferTaskStatus(item.billNo, data.note, this.service.getCurrentUser(), remark).subscribe((data) => {
            console.log('API OUTPUT:' + JSON.stringify(data));
            if (data.success === true) {
                //移除以保存的任务
                if(data.note == STATUS_COMPLETED) {
                    this.service.removeSpecimenTransferTask(item.billNo);
                }
                loader.dismiss();
                this.viewCtrl.dismiss({type: i});
            } else {
                let message = '操作失败，请稍候再试.';
                
                let alert = this.alertCtrl.create({
                    title: '错误',
                    message: message,
                    buttons: ['OK']
                });
                loader.dismiss();
                alert.present();
            }
        }, (error) => {
            loader.dismiss();
            this.service.handleError(error);

        });
    }

    toDecimal2(x) {
        let f = Math.round(x * 100) / 100;
        let s = f.toString();
        let rs = s.indexOf('.');
        if (rs < 0) {
            rs = s.length;
            s += '.';
        }
        while (s.length <= rs + 2) {
            s += '0';
        }
        return s;
    }

}


