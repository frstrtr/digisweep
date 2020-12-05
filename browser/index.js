import * as process from "process";
window["process"] = process;

import 'whatwg-fetch';


const DigiSweep=require('../index');
const $ = require('jquery');

let addressData=[];
let coinAddress;
let assetAddress;
$(function() {
    /*___     _             ___
     |_ _|_ _| |_ _ _ ___  | _ \__ _ __ _ ___
      | || ' \  _| '_/ _ \ |  _/ _` / _` / -_)
     |___|_||_\__|_| \___/ |_| \__,_\__, \___|
                                    |___/
     */

//show intro
    $("#intro_page").show();

//handle start button click
    $("#start").click(() => {
        $(".page").hide();
        $("#start_page").show();
    });

    /*___ _            _     ___
     / __| |_ __ _ _ _| |_  | _ \__ _ __ _ ___
     \__ \  _/ _` | '_|  _| |  _/ _` / _` / -_)
     |___/\__\__,_|_|  \__| |_| \__,_\__, \___|
                                     |___/
     */
    $("#mnemonic").keyup(()=>{
        let mnemonicLength = $("#mnemonic").val().trim().split(/[\s]+/).length;
        if (mnemonicLength>1) {
            let nextBiggest=Math.min(24,Math.max(12,Math.ceil(mnemonicLength/3)*3));
            console.log(nextBiggest);
            $("#mnemonic_length").val(nextBiggest);
        } else {
            console.log(1);
            $("#mnemonic_length").val("1");
        }
    });

    $("#scan").click(async () => {
        try {
            //show scanning screen
            $(".page").hide();
            $("#scanning_page").show();

            //get desired length
            let length = $("#mnemonic_length").val();

            //get inputs
            let mnemonic = $("#mnemonic").val().trim();
            coinAddress = $("#coinaddress").val().trim();
            assetAddress = $("#assetaddress").val().trim();

            //validate inputs
            if (!DigiSweep.validAddress(coinAddress)) throw coinAddress + " is not a valid address";
            if (!DigiSweep.validAddress(assetAddress)) throw coinAddress + " is not a valid address";

            //gather address data
            if (length === 1) {
                //private key
                addressData = await DigiSweep.lookupAddress(mnemonic);
                if (addressData.length === 0) throw "Private key was never used";
            } else {
                //rebuild progress html every 2 sec
                let progressData = {};
                let timer = setInterval(() => {
                    let html = '<div class="row"><div class="cell header">Path</div><div class="cell header">Addresses</div><div class="cell">Balance</div><div class="cell">Done</div></div>';
                    for (let pathName in progressData) {
                        html += progressData[pathName];
                    }
                    $("#scan_progress").html(html);
                }, 2000);

                //gather data and update progress
                addressData = await DigiSweep.recoverMnemonic(mnemonic, length, (pathName, i, balance, done) => {
                    console.log(pathName,i,balance,done);
                    progressData[pathName] = `<div class="row"><div class="cell">${pathName}</div><div class="cell">${i}</div><div class="cell">${balance}</div><div class="cell">${done}</div></div>`;
                });

                //clear timer and handle common error
                clearInterval(timer);
                if (addressData.length === 0) throw "Mnemonic was never used";
            }

            //gather balance
            let balanceTotal = 0;
            for (let {balance} of addressData) balanceTotal += balance;
            $("#balance").html(balanceTotal.toFixed(8));

            //show send_page
            $(".page").hide();
            $("#send_page").show();
        } catch (e) {
            showError(e.toString());
        }
    });

    /*___                   ___
     | __|_ _ _ _ ___ _ _  | _ \__ _ __ _ ___
     | _|| '_| '_/ _ \ '_| |  _/ _` / _` / -_)
     |___|_| |_| \___/_|   |_| \__,_\__, \___|
                                    |___/
     */
    const showError = (message) => {
        //show error screen
        $(".page").hide();
        $("#error_page").show();
        $("#error_message").html(message);
    }

    $("#back").click(() => {
        $(".page").hide();
        $("#start_page").show();
    });

    /*___              _   ___
     / __| ___ _ _  __| | | _ \__ _ __ _ ___
     \__ \/ -_) ' \/ _` | |  _/ _` / _` / -_)
     |___/\___|_||_\__,_| |_| \__,_\__, \___|
                                   |___/
     */
    $("#send").click(async () => {
        //show processing screen
        $(".page").hide();
        $("#processing_page").show();

        //send and get txids
        try {
            let txids = await DigiSweep.sendTXs(addressData, coinAddress, assetAddress);
            $("#complete_txid_message").html('<p>' + txids.join("</p><p>") + '</p>');

            //show complete_page
            $(".page").hide();
            $("#complete_txid_page").show();
        } catch (e) {
            showError("unexpected error");
        }
    });


    $("#build").click(async () => {
        //show processing screen
        $(".page").hide();
        $("#processing_page").show();

        //send and get txids
        try {
            let messages = await DigiSweep.buildTXs(addressData, coinAddress, assetAddress);
            $("#complete_build_message").html('<p>' + messages.join("</p><p>") + '</p>');

            //show complete_page
            $(".page").hide();
            $("#complete_build_page").show();
        } catch (e) {
            showError("unexpected error");
        }
    });
});