/// <reference path="jquery-3.7.0.js" />

"use strict";

$(() => {

    handleHome();

    $("a.nav-link").click(function () {

        // Pill UI: 
        $("a.nav-link").removeClass("active");
        $(this).addClass("active");

        // Display correct section:
        const sectionId = $(this).attr("data-section");
        $("section").hide();
        $("#" + sectionId).show();

    });

    $("#coinsContainer").on("click", ".more-info", async function () {
        const coinId = $(this).attr("id").substring(7);
        await handleMoreInfo(coinId);
    });

    $("#homeLink").click(async () => await handleHome());
    $("#reportsLink").click(() => { });
    $("#aboutLink").click(() => { });


    //Handles the home section.

    async function handleHome() {
        // Retrieve selected coins from local storage or use an empty array
        const selectedCoins = JSON.parse(localStorage.getItem("selectedCoins")) || [];
        // Set the checked state of checkboxes based on selected coins
        selectedCoins.forEach((coin) => {
            $(`#check${coin}`).prop("checked", true);
        });
        localStorage.removeItem("selectedCoins"); // Clear selected coins from local storage


        // Change it before finish!!!!!!!!!!!!!!!!!!!!!!!:
        const coins = await getJson("coins.json");
        // const coins = await getJson("https://api.coingecko.com/api/v3/coins/list");
        displayCoins(coins);
        toggleCoin("vix");
        toggleCoin("zrx");
        toggleCoin("1mb");
        toggleCoin("oxd");

    }

    // Displays the coins in the UI.
    function displayCoins(coins) {
        coins = coins.filter(c => c.symbol.length <= 3);
        let html = "";
        for (let i = 0; i < 100; i++) {
            html += `
            <div class="card"  style="width: 18rem; height: 20rem; overflow: auto;" id="${coins[i].symbol}">
            
                <div class="card-body">

                <div class="form-check form-switch">
                <input class="form-check-input toggle-card" type="checkbox" id="toggle_${coins[i].id}">
                <label class="form-check-label" for="toggle_${coins[i].id}"></label>
                </div>

                    <h5 class="card-title">${coins[i].symbol}</h5>
                    <p class="card-text">${coins[i].name}</p>



                    <button id="button_${coins[i].id}" class="btn btn-primary more-info" data-bs-toggle="collapse" data-bs-target="#collapse_${coins[i].id}" >
                        More Info
                    </button>
                    <div style="min-height: 120px;">
                        <div class="collapse collapse-horizontal" id="collapse_${coins[i].id}">
                            <div class="card card-body" style="width: 150px;">
                                <img class="loadingGif" src="assets/images/wait.gif" alt="Loading...">
                            </div>
                        </div>
                    </div>

                </div>
            </div>
            `;
        }
        $("#coinsContainer").html(html);
    }

    //Handles the "More Info" button click event.
    async function handleMoreInfo(coinId) {
        console.log("check");

        const coin = await getJson("https://api.coingecko.com/api/v3/coins/" + coinId);
        const imageSource = coin.image.thumb;
        const usd = coin.market_data.current_price.usd;
        const eur = coin.market_data.current_price.eur;
        const ils = coin.market_data.current_price.ils;
        const moreInfo = `
            <img src="${imageSource}"> <br>
            USD: $${usd} <br>
            EUR: Є${eur} <br>
            ILS: ₪${ils}
        `;
        $(`#collapse_${coinId}`).children().html(moreInfo);

    }

    //  Fetches JSON data from the specified URL.
    async function getJson(url) {
        const response = await fetch(url);
        const json = await response.json();
        return json;
    }


    $("#search-btn").click(() => {
        const searchInput = $("#search-input").val().toUpperCase();

        if (searchInput === "") {
            $("#errorSearchContainer").html("Please enter a valid coin name to search.");
            return;
        }

        let coinFound = false; // Flag to track if the coin is found

        $(".card").each(function () {
            const cardId = $(this).attr("id");
            if (cardId && cardId.toUpperCase() === searchInput) {
                $(this).show();
                coinFound = true;

            }
            else
                $(this).hide();

            if (!coinFound)
                $("#errorSearchContainer").html("Please enter a valid coin name to search.");
            else {
                $("#errorSearchContainer").html(""); // Clear the error message if a coin is found


            }


        })

        // Empty the search box
        $("#search-input").val("");

    });

    function displayModalDialog() {
        const modal = $("#myModal");
        const selectedCoinsList = $("#selectedCoinsList");
        const cancelCurrencySelect = $("#cancelCurrencySelect");
        const keepSelectionBtn = $("#keepSelectionBtn");

        // Clear the existing list and dropdown options
        selectedCoinsList.empty();
        cancelCurrencySelect.empty();

        // Get the names of the selected coins and add them to the list and dropdown
        $(".toggle-card:checked").each(function () {
            const coinName = $(this).closest(".card").find(".card-title").text();
            selectedCoinsList.append(`<li>${coinName}</li>`);
            cancelCurrencySelect.append(`<option>${coinName}</option>`);
        });

        // Show the modal dialog
        modal.modal("show");



    }


    //define a variable for the six coin
    let sixCoinNameToAdd = "";
    $("#coinsContainer").on("change", ".toggle-card", function () {
        const selectedCoins = $(".toggle-card:checked").length;

        // Define the maximum number of allowed coins
        const maxCoins = 5;

        if (selectedCoins > maxCoins) {
            sixCoinNameToAdd = $(this).closest(".card").find(".card-title").text();
            //prevent user to select the coin until he cancel another one:
            toggleCoin(sixCoinNameToAdd);
            // Show the modal dialog
            displayModalDialog();
        }

        // Log the selected coins in the console
        const selectedCoinNames = [];
        $(".toggle-card:checked").each(function () {
            const coinName = $(this).closest(".card").find(".card-title").text();
            console.log(coinName);
            selectedCoinNames.push(coinName);
        });
        console.log("Selected coins:", selectedCoinNames);


    });

    let selectedCoinToCancel;
    let toggleSwitch;


    $("#cancelCurrencyBtn").click(function () {
        selectedCoinToCancel = $("#cancelCurrencySelect").val();

        // Find the corresponding toggle switch for the canceled currency
        toggleSwitch = $(`.toggle-card[value="${selectedCoinToCancel}"]`);
        console.log(" coin:", selectedCoinToCancel);
        toggleCoin(selectedCoinToCancel);

        $("#myModal").modal("hide");


        // Store the selected coin in a variable
        const selectedCoin = $("#cancelCurrencySelect option:selected").text();
        console.log("Selected coin:", selectedCoin);

        selectedCoinToCancel = null;
        toggleSwitch = null;

        // toggle again the sixth coin we want to add:
        toggleCoin(sixCoinNameToAdd);

    });

    function toggleCoin(coinName) {
        // Find the checkbox for the specified coin name
        const checkbox = $(`#${coinName} .toggle-card`);

        // Get the current state of the checkbox
        const currentState = checkbox.prop("checked");

        // Toggle the state of the checkbox
        checkbox.prop("checked", !currentState);

        // Trigger the change event to update the checkbox state
        checkbox.trigger("change");
    }

    $("#keepSelectionBtn").click(() => {
        const lastSelectedCoin = $(".toggle-card:checked").last();

        // Find coin name:
        const coinName = lastSelectedCoin.closest(".card").find(".card-title").text();

        //hide model:
        $("#myModal").modal("hide");
    })

});
