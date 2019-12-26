/*
  Description: 数据服务
  Author: ZhuChenjie
  Create Date: 2017-05-04
 */

import { Injectable } from '@angular/core';
import { Http, Headers, RequestOptions, URLSearchParams } from '@angular/http';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/timeout';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Storage } from '@ionic/storage';
import { LoadingController, AlertController } from 'ionic-angular';

/*
 Generated class for the Service provider.

 See https://angular.io/docs/ts/latest/guide/dependency-injection.html
 for more info on providers and Angular 2 DI.
 */
@Injectable()
export class Service {

    //config*********************************************************
    version = "1.0.2(2019121201)";
    mode = "test";//dev, test, prod
    dev = "dev";
    test = "test";
    prod = "prod";
    devPrefix = "/apid";
    testPrefix = "http://106.14.61.156/kmfs";
    // testPrefix = "http://172.28.112.208:8080/yozan"
    // testPrefix = "http://transport.shyozan.com/yozantest";
    // prodPrefix = "http://hrwechat-qas.svw.cn";
    prodPrefix = "http://106.14.61.156/kmfs";
    timeout = 30000;
    apptimeout = 60000;
    interval = 600000;
    //**************************************************************


    url: string = "assets/json/list.json";
    user;
    pwd;
    activeUser = new BehaviorSubject(null);
    lastrefresh = 0;
    lang;

    constructor(public http: Http, public storage: Storage, public loadingCtrl: LoadingController, public alertCtrl: AlertController) {
    }

    getVersion() {
        return this.version;
    }

    //转换4位数版本号
    toNum(a) {
        let s = a.toString();
        let c = s.split('.');
        let r = ["0000", "000", "00", "0", ""];
        for (let i = 0; i < c.length; i++) {
            let len = c[i].length;
            c[i] = r[len] + c[i];
        }
        let res = c.join('');
        return res;
    }

    hasNewVersion(currentVersion, serverVersion) {
        return this.toNum(currentVersion) < this.toNum(serverVersion);
    }

    //登入系统
    doLogin(username, password) {
        let authHeader = new Headers();
        // let body = '{"username":"' + username + '", "password":"' + password + '"}';
        let body = new URLSearchParams();
        body.append("username", username);
        body.append("password", password);
        let url = this.getUrl('login');
        authHeader.append('Content-Type', 'application/x-www-form-urlencoded');
        // authHeader.append('Authorization', 'Basic ' + this.getAuthorizationBasic());
        return this.http.post(url, body, {
            headers: authHeader,
        }).timeout(this.timeout).map(res => res.json())
    }

    /*
        getTransferTaskList(username) {
            let authHeader = new Headers();
            let body = new URLSearchParams();
            body.append("username", username);
            let url = this.getUrl('getTransferTask');
            authHeader.append('Content-Type', 'application/x-www-form-urlencoded');
            // authHeader.append('Authorization', 'Basic ' + this.getAuthorizationBasic());
            return this.http.post(url, body, {
                headers: authHeader,
            }).timeout(this.timeout).map(res => res.json())
        }
    */
    //浏览所有任务清单，其中项目人员和运送领班岗位是全部可见
    listTransferTaskByOperator(username) {
        let authHeader = new Headers();
        let body = new URLSearchParams();
        body.append("username", username);
        let url = this.getUrl('listTransferTaskByOperator');
        authHeader.append('Content-Type', 'application/x-www-form-urlencoded');
        // authHeader.append('Authorization', 'Basic ' + this.getAuthorizationBasic());
        return this.http.post(url, body, {
            headers: authHeader,
        }).timeout(this.timeout).map(res => res.json())
    }

    //获得具体任务的明细
    getTransferTaskByBillNo(billNo) {
        let authHeader = new Headers();
        let body = new URLSearchParams();
        body.append("billNo", billNo);
        let url = this.getUrl('getTransferTaskByBillNo');
        authHeader.append('Content-Type', 'application/x-www-form-urlencoded');
        // authHeader.append('Authorization', 'Basic ' + this.getAuthorizationBasic());
        return this.http.post(url, body, {
            headers: authHeader,
        }).timeout(this.timeout).map(res => res.json())
    }

    //更改任务状态 完工-派工
    updateTransferTaskStatus(billNo, billstatus, username) {
        console.log('订单号:'+ billNo+' 订单状态:'+billstatus);
        let authHeader = new Headers();
        let body = new URLSearchParams();
        body.append("billNo", billNo);
        body.append("status", billstatus);  // "完成"
        body.append("username", username);

        let url = this.getUrl('updateTransferTaskStatus');
        authHeader.append('Content-Type', 'application/x-www-form-urlencoded');
        // authHeader.append('Authorization', 'Basic ' + this.getAuthorizationBasic());
        return this.http.post(url, body, {
            headers: authHeader,
        }).timeout(this.timeout).map(res => res.json())
    }

    //修改用户状态（暂存）
    updateUserStatus(isLogin:boolean) {
        console.log('update user status:'+ isLogin?'online':'offline');
        let authHeader = new Headers();
        let body = new URLSearchParams();
        body.append("username", this.getCurrentUser());
        body.append("status", isLogin?'online':'offline');

        let url = this.getUrl('updateUserStatus');
        authHeader.append('Content-Type', 'application/x-www-form-urlencoded');
        // authHeader.append('Authorization', 'Basic ' + this.getAuthorizationBasic());
        return this.http.post(url, body, {
            headers: authHeader,
        }).timeout(this.timeout).map(res => res.json());
    }

    //登出系统
    doLogout() {
        this.storage.remove(this.encrypt("userid"));
        //设置离线
        this.updateUserStatus(false).subscribe((data)=>{
            if(data.success === true) {
              console.log('update user status success:'+JSON.stringify(data));
            }
        });
        this.storage.remove(this.encrypt("password"));
        this.storage.set(this.encrypt("logouttime"), this.encrypt(new Date().toLocaleString()));
        this.user = null;
        this.activeUser.next(null);
    }

    saveUser(userid, password) {
        this.storage.set(this.encrypt("userid"), this.encrypt(userid));
        this.storage.set(this.encrypt("password"), this.encrypt(password));
        this.storage.set(this.encrypt("logintime"), this.encrypt(new Date().toLocaleString()));
    }

    saveUserId(userid) {
        this.storage.set(this.encrypt("userid"), this.encrypt(userid));
        this.storage.set(this.encrypt("logintime"), this.encrypt(new Date().toLocaleString()));
    }

    saveUserEmail(email) {
        this.storage.set(this.encrypt("email"), this.encrypt(email));
    }

    encrypt(string) {
        return string;
    }

    decrypt(string) {
        return string;
    }

    setCurrentUser(userid) {
        this.user = userid;
        this.activeUser.next(userid);
    }

    getCurrentUser() {
        if (this.user) {
            return this.user;
        } else {
            this.storage.get(this.encrypt("userid")).then((val) => {
                this.user = this.decrypt(val);
                if (this.user) {
                    this.activeUser.next(this.user);
                    return this.user;
                } else {
                    this.activeUser.next(null);
                    return null;
                }
            })
        }
    }

    getStorageUser() {
        return this.storage.get(this.encrypt("userid"));
        // this.storage.get(this.encrypt("userid")).then((val) => {
        //   this.pwd = this.decrypt(val);
        //   if (this.pwd) {
        //     return this.pwd;
        //   } else {
        //     return '';
        //   }
        // })
    }

    getStoragePwd() {
        return this.storage.get(this.encrypt("password"));
    }

    setCurrentLang(language) {
        this.lang = language;
    }

    saveCurrentLang(language) {
        this.lang = language;
        this.storage.set("language", language);
    }

    getCurrentLanguage() {
        if (this.lang) {
            return this.lang;
        } else {
            return this.storage.get("language").then((val) => {
                if (val) {
                    this.lang = val;
                } else {
                    this.lang = '1';
                }
                return this.lang;
            });
        }
    }

    needRefresh() {
        if (this.lastrefresh == 0) {
            return true;
        } else {
            let d = new Date();
            let current = d.getTime();
            if ((current - this.lastrefresh) >= this.interval) {
                this.lastrefresh = current;
                return true;
            }
        }
        return false;
    }

    setLastRefresh() {
        let d = new Date();
        this.lastrefresh = d.getTime();
    }

    clearLastRefresh() {
        this.lastrefresh = 0;
    }

    handleError(err) {
        console.log(JSON.stringify(err));
        let ok = '确定';
        let timeoutErrorText = '连接超时，请稍后重试';
        let loadingErrorText = '网络错误';
        let linkErrorText = '连接错误，请稍后重试';
        let message;

        if (err.name == 'TimeoutError') {
            message = timeoutErrorText;
            let alert = this.alertCtrl.create({
                title: loadingErrorText,
                message: message,
                buttons: [ok]
            });
            alert.present();
        } else {
            if (err.message) {
                message = err.message;
            } else if (err._body) {
                message = err._body;
            }
            if (!(Object.prototype.toString.call(message) == '[object String]')) {
                message = linkErrorText;
            }
            let alert = this.alertCtrl.create({
                title: loadingErrorText,
                message: message,
                buttons: [ok]
            });
            alert.present();
        }

    }

    private getUrlPrefix() {
        if (this.mode === this.prod) {
            return this.prodPrefix;
        } else if (this.mode === this.test) {
            return this.testPrefix;
        } else {
            return this.devPrefix;
        }
    }

    private getUrl(type) {
        switch (type) {
            case 'login':
                return this.getUrlPrefix() + "/transfer/app/login";
            case 'getTransferTaskList':
                return this.getUrlPrefix() + "/transfer/app/listTransferTaskByUsername";
            case 'getTransferTaskByBillNo':
                return this.getUrlPrefix() + "/transfer/app/getTransferTaskByBillNo";
            case 'updateTransferTaskStatus':
                return this.getUrlPrefix() + "/transfer/app/updateTransferTaskStatus";
            case 'listTransferTaskByOperator':
                return this.getUrlPrefix() + "/transfer/app/listTransferTaskByOperator";
            case 'updateUserStatus':
                return this.getUrlPrefix() + "/transfer/app/updateUserStatus";
        }
    }
}
