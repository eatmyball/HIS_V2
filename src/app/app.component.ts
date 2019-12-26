/*
  Description: 程序入口
  Author: ZhuChenjie
  Create Date: 2017-05-04
 */

import {Component, ViewChild, Renderer} from '@angular/core';
import {Platform, IonicApp, Nav, ToastController, Keyboard, AlertController, LoadingController} from 'ionic-angular';
import {StatusBar} from 'ionic-native';
import { SplashScreen } from '@ionic-native/splash-screen';
import {TabsPage} from '../pages/tabs/tabs';
import {LoginPage} from '../pages/login/login';
import {Service} from "../providers/piservice/service";
import {Storage} from '@ionic/storage';
import {InAppBrowser} from '@ionic-native/in-app-browser';

declare var window: any;

@Component({
    templateUrl: 'app.html'
})
export class MyApp {
    rootPage: any
    backButtonPressed: boolean = false;  //用于判断返回键是否触发
    listenFunc: Function;
    firsrt: boolean = true;
    loader;
    @ViewChild('myNav') nav: Nav;

    constructor(public platform: Platform, public ionicApp: IonicApp, private service: Service,private toastCtrl: ToastController, private keyboard: Keyboard, public alertCtrl: AlertController, public loadingCtrl: LoadingController, public renderer: Renderer, storage: Storage, private iab: InAppBrowser, private splash:SplashScreen) {
        platform.ready().then(() => {
            StatusBar.styleDefault();
            // this.initJPush();
            this.registerBackButtonAction();//注册返回按键事件
            this.doInit();
            this.splash.hide();
            // this.rootPage = LoginPage;
        }).catch(e => console.log(e));
    }


    doInit() {
        this.init();
        this.registerAuthentication();

    }

    init() {
        this.service.getCurrentUser();
    }

    //设置首页跳转
    registerAuthentication() {
        // this.rootPage = LoginPage;
        this.service.activeUser.subscribe((user) => {
            console.log('current login user:'+ JSON.stringify(user));
            if (user) {
                this.rootPage = TabsPage;
                //更新登录状态
                this.service.updateUserStatus(true).subscribe((data)=>{
                    if(data.success === true) {
                    console.log('update user status success:'+JSON.stringify(data));
                    }
                });
                //记录推送alias
                // (<any>window).JPush.setAlias({sequence:1, alias: user.LoginID}, (result)=>{
                //     console.log('Jpush set alias success');
                // }, (error)=>{
                //     console.log('Jpush set alias failed:'+error.code);
                // });
                
            } else {
                this.rootPage = LoginPage;
            }
        });
    }

    //注册返回按钮事件
    registerBackButtonAction() {
        this.platform.registerBackButtonAction(() => {
            if (this.keyboard.isOpen()) {//如果键盘开启则隐藏键盘
                this.keyboard.close();
                return;
            }
            //如果想点击返回按钮隐藏toast或loading或Overlay就把下面加上
            // this.ionicApp._toastPortal.getActive() ||this.ionicApp._loadingPortal.getActive()|| this.ionicApp._overlayPortal.getActive()
            let activePortal = this.ionicApp._modalPortal.getActive();
            if (activePortal) {
                activePortal.dismiss();
                return;
            }
            let activeVC = this.nav.getActive();
            let tabs = activeVC.instance.tabs;
            let activeNav = tabs.getSelected();
            return activeNav.canGoBack() ? activeNav.pop() : this.showExit()
        }, 1);
    }

    //双击退出提示框
    showExit() {
        if (this.backButtonPressed) { //当触发标志为true时，即2秒内双击返回按键则退出APP
            this.platform.exitApp();
        } else {
            this.toastCtrl.create({
                message: '再按返回键退出程序',
                duration: 2000,
                position: 'bottom'
            }).present();
            this.backButtonPressed = true;
            setTimeout(() => this.backButtonPressed = false, 2000);//2秒内没有再次点击返回则将触发标志标记为false
        }
    }

    //极光推送初始化
  initJPush() {
    (<any>window).JPush.init();
    //注册推送回调事件
    setTimeout(() => {
      this.registePushEvent();
    }, 1000);
    (<any>window).JPush.setDebugMode(true); //打印极光日志

  }

  registePushEvent() {
    (<any>window).JPush.getRegistrationID((rId) => {
      console.log("jpush ID"+rId);
    });

    document.addEventListener("jpush.openNotification", (event) => {
        console.log("Jpush Open:"+JSON.stringify(event));
    }, false);

    document.addEventListener("jpush.receiveMessage", (event) => {
        console.log("Jpush Message:" +JSON.stringify(event));
    }, false);
    //收到推送
    document.addEventListener("jpush.receiveNotification", (event) => {
        console.log("Jpush receive Noti:"+JSON.stringify(event));
    }, false);
  }
}
