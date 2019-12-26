/*
  Description: 登录页面
  Author: ZhuChenjie
  Create Date: 2017-05-04
 */

import {Component} from '@angular/core';
import {NavController, NavParams, AlertController, LoadingController} from 'ionic-angular';
import {FormBuilder, Validators} from '@angular/forms';
import {Service} from "../../providers/piservice/service";

/*
 Generated class for the Login page.

 See http://ionicframework.com/docs/v2/components/#navigation for more info on
 Ionic pages and navigation.
 */
@Component({
  selector: 'page-login',
  templateUrl: 'login.html'
})
export class LoginPage {

  remember = false;
  loginText = '登录中';
  loginErrText = '用户名或密码错误，请重试';
  loginErrTitleText = '登录错误';
  ok = '确定';
  nameValue;
  pwdValue;
  constructor(public navCtrl: NavController, public navParams: NavParams, private formBuilder: FormBuilder, public alertCtrl: AlertController, public loadingCtrl: LoadingController, public service: Service) {
  }

  ionViewWillEnter() {
    this.service.getStorageUser().then((val) => {
      this.nameValue = val;
    });
    this.pwdValue = this.service.getStoragePwd().then((val) => {
      this.pwdValue = val;
      if (this.pwdValue) {
        this.remember = true;
      }
    });
  }

  loginForm = this.formBuilder.group({
    //'LoginID': ['admin@163.com', [Validators.required, Validators.pattern('^([a-zA-Z0-9_.]*)((@[a-zA-Z0-9_.]*)\.([a-zA-Z]{2}|[a-zA-Z]{3}))$')]],
    'LoginID': ['', [Validators.required, Validators.minLength(1)]],
    'LoginPwd': ['', [Validators.required, Validators.minLength(1)]]
  });

  login(user, event) {
    event.preventDefault();
    let loader = this.loadingCtrl.create({
      content: this.loginText,
    });
    loader.present();
    this.service.doLogin(user.LoginID, user.LoginPwd).subscribe((data) => {
      console.log(JSON.stringify(data));
      if (data.success === true) {
        loader.dismiss();
        if (this.remember) {
          this.service.saveUser(user.LoginID, user.LoginPwd);
        }
        this.service.setCurrentUser(user.LoginID);
        //更新登录状态
        this.service.updateUserStatus(true).subscribe((data)=>{
          if(data.success === true) {
            console.log('update user status success:'+JSON.stringify(data));
          }
        });
        //记录推送alias
        
        // (<any>window).JPush.setAlias({sequence:1, alias: user.LoginID}, (result)=>{
        //   console.log('Jpush set alias success');
        // }, (error)=>{
        //   console.log('Jpush set alias failed:'+error.code);
        // });

      } else {
        loader.dismiss();
        let alert = this.alertCtrl.create({
          title: this.loginErrTitleText,
          message: this.loginErrText,
          buttons: [this.ok]
        });
        alert.present();
      }
    }, err => {
      loader.dismiss();
      this.service.handleError(err);
    });
  }
}
