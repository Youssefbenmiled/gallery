import { Component, OnInit, ViewChild } from '@angular/core';
import { Platform, AlertController, ToastController, ActionSheetController, IonBackButtonDelegate } from '@ionic/angular';
import { FileOpener } from '@ionic-native/file-opener/ngx';
import { File, Entry } from '@ionic-native/file/ngx';
import { Router, ActivatedRoute } from '@angular/router';
import { PhotoService, Photo } from '../services/photo.service';
import {
    Plugins, CameraResultType, Capacitor, FilesystemDirectory,
    CameraPhoto, CameraSource
} from '@capacitor/core';


const { Camera, Filesystem, Storage } = Plugins;


@Component({
    selector: 'app-home',
    templateUrl: 'home.page.html',
    styleUrls: ['home.page.scss'],
})

export class HomePage implements OnInit {
    @ViewChild(IonBackButtonDelegate, { static: false }) backButtonDelegate: IonBackButtonDelegate;
    copyFile = null;
    copyFolder = null;

    folder = '';
    directories = [];

    constructor(
        private actionSheetController: ActionSheetController,
        private _file: File,
        private _fileopner: FileOpener,
        private _plt: Platform,
        private _alertCtrl: AlertController,
        private toastCtrl: ToastController,
        private _router: Router,
        private _actifRoute: ActivatedRoute,
        public photoService: PhotoService,
        public platform: Platform

    ) {

    }



    async ngOnInit() {


        await this.photoService.loadSaved();

        this.folder = this._actifRoute.snapshot.paramMap.get('folder') || ''
        this.loadDocs();
        this.copyFile = null;
        this.copyFolder = null;

    }



    loadDocs() {


        this._plt.ready().then(() => {

            this._file.listDir(this._file.dataDirectory, this.folder).then((res) => {
                this.directories = res;

            })

        });


    }

    async createFolder() {

        let alert = await this._alertCtrl.create({
            header: 'Create folder',
            message: 'Please specify the name of the folder',
            inputs: [{

                name: 'name',
                type: 'text',
                placeholder: 'folder name'
            }],
            buttons: [{
                text: 'Cancel',
                role: 'cancel',
                cssClass: 'secondary'
            },
            {
                text: 'Create',
                handler: data => {

                    this._file.createDir(
                        //this._file.externalRootDirectory, 'my_downloads',
                        // `${this._file.dataDirectory}/${data.name}`,
                        // "file:///data/user/0/io.ionic.starter/files/Documents/",
                        // this._file.dataDirectory+"/"+data.name
                        `${this._file.dataDirectory}/${this.folder == '' ? 'sans nom' : this.folder}/`,
                        data.name,
                        false
                    ).then((value) => {

                        this.loadDocs();
                    });
                }
            }

            ]
        });//fin create
        await alert.present();

    }


    async createFile() {
        let alert = await this._alertCtrl.create({
            header: 'Create file',
            message: 'Please specify the name of the file',
            inputs: [{

                name: 'name',
                type: 'text',
                placeholder: 'MyFile'
            }],
            buttons: [{
                text: 'Cancel',
                role: 'cancel',
                cssClass: 'secondary'
            },
            {
                text: 'Create',
                handler: async data => {
                    const capturedPhoto = await Camera.getPhoto({
                        resultType: CameraResultType.Base64, // file-based data; provides best performance
                        source: CameraSource.Camera, // automatically take a new photo with the camera
                        quality: 100 // highest quality (0 to 100)
                    })
                        // .then((res => {
                        //     // let base64ImageData = 'data:image/jpeg;base64,' + res;
                        //     // `data:image/jpeg;base64,${res.dataUrl}`

                        //     this.writeFile(res.dataUrl, `${this._file.dataDirectory}/${this.folder}/`,
                        //         `${data.name}.jpeg`, res.dataUrl)

                        // }))



                        // this.photoService.savePicture(capturedPhoto)
                        // this._file.writeFile(
                        //     `${this._file.dataDirectory}/${this.folder}/`,
                        //     `${data.name}.txt`,
                        //     `My custom text - ${new Date().getTime()}`
                        // )
                        .then(async (image) => {
                            console.log(image.base64String, image.base64String, image.webPath, 'objj')
                            // this._file.writeFile(filePath, fileName, DataBlob, contentType).then((success) => {

                            // this._file.writeFile(
                            //     `${this._file.dataDirectory}/${this.folder}/`,
                            //     `${data.name}.jpeg`,
                            //     await this.photoService.readAsBase64(capturedPhoto).then((res) => {
                            //         return res;
                            //     })
                            //     // `My custom text - ${new Date().getTime()}`
                            // )

                            this.writeFile(image.base64String, `${this._file.dataDirectory}/${this.folder}/`, `${data.name == '' ? 'sans nom' : data.name}.jpeg`, image.base64String)

                        })
                    this.loadDocs();

                }
            }

            ]
        });//fin create
        await alert.present();

    }



    addPhotoToGallery() {
        this.photoService.addNewToGallery();
    }

    public writeFile(base64Data: any, filePath: string, fileName: any, content) {
        let contentType = this.getContentType(base64Data);
        let DataBlob = this.base64toBlob(content, contentType);
        // here iam mentioned this line this.file.externalRootDirectory is a native pre-defined file path storage. You can change a file path whatever pre-defined method.  
        // let filePath = this._file.externalRootDirectory + folderName;
        this._file.writeFile(filePath, fileName, DataBlob, contentType).then((success) => {
            console.log("File Writed Successfully", success);
        }).catch((err) => {
            console.log("Error Occured While Writing File", err);
        })
    }



    //here is the method is used to get content type of an bas64 data  
    public getContentType(base64Data: any) {
        let block = base64Data.split(";");
        let contentType = block[0].split(":")[1];
        return contentType;
    }



    //here is the method is used to convert base64 data to blob data  
    public base64toBlob(b64Data, contentType) {
        contentType = contentType || '';
        let sliceSize = 512;
        let byteCharacters = atob(b64Data);
        let byteArrays = [];
        for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            let slice = byteCharacters.slice(offset, offset + sliceSize);
            let byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
        let blob = new Blob(byteArrays, {
            type: contentType
        });
        return blob;
    }

    deleteFile(entry: Entry) {


        let path = this._file.dataDirectory + this.folder;



        switch (entry.isDirectory) {

            case true:
                this._file.removeRecursively(path, entry.name).then(() => { });

                break;
            case false:

                this._file.removeFile(path, entry.name).then(() => { });

                break;

        }

        this.loadDocs();


    }





    public async showActionSheet(photo: Entry, path: string) {
        const actionSheet = await this.actionSheetController.create({
            header: 'Photos',
            buttons: [
                {
                    text: 'Open',
                    role: 'destructive',
                    icon: 'open',
                    handler: () => {
                        this._fileopner.open(photo.nativeURL, 'image/jpeg');

                    }
                },
                {
                    text: 'Cut',
                    role: 'destructive',
                    icon: 'cut',
                    handler: () => {
                        this.copyFile = { "path": path, "name": photo.name };

                        this.photoService.myFileParam = this.copyFile
                        this.photoService.mode = "cutFile"

                    }
                },
                {
                    text: 'Copy',
                    role: 'destructive',
                    icon: 'copy',
                    handler: () => {
                        this.copyFile = { "path": path, "name": photo.name };

                        this.photoService.myFileParam = this.copyFile
                        this.photoService.mode = "copyFile"

                    }
                },
                {
                    text: 'Delete',
                    role: 'destructive',
                    icon: 'trash',
                    handler: () => {
                        this.deleteFile(photo);
                        this.copyFile = null;

                        // this.photoService.deletePicture(photo, position);
                    }
                }, {
                    text: 'Cancel',
                    icon: 'close',
                    role: 'cancel',
                    handler: () => {
                        this.CancelAll();
                        // Nothing to do, action sheet is automatically closed
                    }
                }]
        });
        await actionSheet.present();
    }



    async itemClicked(file: Entry) {
        let path = this._file.dataDirectory + this.folder;
        switch (file.isDirectory) {
            case true:
                let pathOpen = this.folder != '' ? this.folder + '/' + file.name : file.name;
                let folder = encodeURIComponent(pathOpen)
                this._router.navigateByUrl(`/home/${folder}`)
                break;
            case false:
                this.showActionSheet(file, path);
                break;
        }
    }

    handle(folder?: Entry, mode?: string) {

        if (this.photoService.mode && this.photoService.mode.includes("File")) {
            this.handleFile()

        } else
            if (mode.includes('Folder')) {

                let path = this._file.dataDirectory + this.folder;

                this.photoService.mode = mode;
                this.copyFolder = { "path": path, "name": folder.name };
                this.photoService.myFolderParam = this.copyFolder
                // this.handleFolder();

            }

    }

    handleFile() {

        switch (this.photoService.mode) {
            case "copyFile":
                this.pasteFile();
                break;
            case "cutFile":
                this.moveFile();
                break;

            default:
                this.CancelAll();
                break;
        }


    }

    handleFolder() {

        switch (this.photoService.mode) {
            case "copyFolder":
                this.pasteFolder();
                break;
            case "moveFolder":
                this.moveFolder();
                break;
            default:
                this.CancelAll();
                break;
        }


    }


    pasteFile() {
        let newPath = this._file.dataDirectory + this.folder;
        this._file.copyFile(this.photoService.myFileParam.path, this.photoService.myFileParam.name, newPath, this.photoService.myFileParam.name)
            .then((value) => {
                this.loadDocs();
                this.CancelAll();
            }).catch((err) => { })
    }

    moveFile() {
        let newPath = this._file.dataDirectory + this.folder;
        this._file.moveFile(this.photoService.myFileParam.path, this.photoService.myFileParam.name, newPath, this.photoService.myFileParam.name)
            .then((value) => {
                this.loadDocs();
                this.CancelAll();
            }).catch((err) => { })
    }


    pasteFolder() {
        let newPath = this._file.dataDirectory + this.folder;

        this._file.copyDir(this.photoService.myFolderParam.path, this.photoService.myFolderParam.name, newPath, this.photoService.myFolderParam.name).then((value) => {
            this.loadDocs();
            this.CancelAll();


        }).catch((err) => { })

    }

    moveFolder() {
        let newPath = this._file.dataDirectory + this.folder;


        this._file.moveDir(this.photoService.myFolderParam.path, this.photoService.myFolderParam.name, newPath, this.photoService.myFolderParam.name)
            .then((value) => {
                alert(newPath)
                this.loadDocs();
                this.CancelAll();
            }).catch((err) => { })
    }



    CancelAll() {
        this.copyFile = null;
        this.copyFolder = null;

        this.photoService.myFileParam = null
        this.photoService.myFolderParam = null

        this.photoService.mode = null
    }



}
