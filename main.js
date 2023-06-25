/// <reference path="jquery-3.7.0.js" />

"use strict";

$(() => {
    // let chart; // Declare the chart variable outside of the handleHome() function

    handleHome();

    // Clean the storage before open new page
    localStorage.clear();

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

    $("#reportsLink").click(() => {
        handleReports();

    });

    $("#aboutLink").click(() => {

    });

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
        toggleCoin("zoc");
        // toggleCoin("zrx");
        // toggleCoin("1mb");
        // toggleCoin("oxd");
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
                        <div class="collapse collapse" id="collapse_${coins[i].id}">
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
        if (localStorage.getItem(coinId) === null) {
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



            // $(`#collapse_${coinId}`).children().html(moreInfo);
            $(`#collapse_${coinId}`).html(moreInfo);

            // Insert the Data to the local storage:
            localStorage.setItem(`${coinId}`, JSON.stringify({
                imageSource,
                usd,
                eur,
                ils
            }));

            // Remove data from local storage after 2 minutes
            setTimeout(() => {
                localStorage.removeItem(coinId);
            }, 120000);

        }

        else {
            // Currency information found in local storage, display stored data
            const storageData = JSON.parse(localStorage.getItem(`${coinId}`));
            // Generate HTML content with the retrieved data
            const storedInfo = `
                <img src="${storageData.imageSource}"> <br>
                USD: $${storageData.usd} <br>
                EUR: €${storageData.eur} <br>
                ILS: ₪${storageData.ils} 
                `;

            // Clear the existing content of the collapsible element
            $(`.${coinId}`).empty();

            // Update the collapsible element with the new HTML content
            $(`.${coinId}`).append(storedInfo);

        }


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

        const selectedCoinNames = recognizeSelectedCoinsReturnArrOfThereNames();

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

    function recognizeSelectedCoinsReturnArrOfThereNames() {
        const selectedCoinNames = [];
        $(".toggle-card:checked").each(function () {
            const coinName = $(this).closest(".card").find(".card-title").text();
            console.log(coinName);
            selectedCoinNames.push(coinName);
        });
        return selectedCoinNames;

    }

    let coinData = {};

    let intervalId;


    function handleReports() {



        console.log("handleReports start:");
        const selectedCoins = recognizeSelectedCoinsReturnArrOfThereNames();
        if (selectedCoins.length <= 0) {
            alert("Please choose at least one coin");
            $("#loadingGifContainer").hide();
            return;

        }

        console.log(selectedCoins);
        let coinsToShow = selectedCoins.map(coin => coin);
        console.log(coinsToShow);
        let coinsId = coinsToShow.join();
        console.log(coinsId);

        // let coinData = {};
        cleanup(); // Call the cleanup function before starting the interval


        intervalId = setInterval(function () {
            getReportData(coinsId, function (data) {
                if (data["Response"] === "Error") {
                    alert("Error..");
                    return;
                }
                for (let coin in data) {
                    if (!coinData[coin]) {
                        coinData[coin] = [];
                    }
                    coinData[coin].push({ x: new Date(), y: data[coin]["USD"] });

                }

                renderChart(coinData);

                // Hide the loading GIF after data is updated
                $("#loadingGifContainer").hide();

            });
        }, 2000)

    }

    function cleanup() {
        clearInterval(intervalId); // Clear the interval
        coinData = {}; // Reset the coinData object
    }

    // Get data of coins checked by the user
    async function getReportData(symbols, callback) {

        const response = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=usd,eur,ils`);
        const data = await response.json()
        callback(data);
    }

    function renderChart(coinsData) {
        let dataObjects = [];

        for (let coin in coinsData) {

            dataObjects.push({
                type: "spline",
                showInLegend: true,
                name: coin,
                dataPoints: coinsData[coin]
            });

        }


        let chart = new CanvasJS.Chart("chartContainer", {
            title: {
                text: "Virtual Coins Live Reports"
            },
            axisX: {
                interval: 2,
                intervalType: "second"
            },
            axisY: [
                {
                    title: "Linear Scale",
                    lineColor: "#369EAD",
                    titleFontColor: "#369EAD",
                    labelFontColor: "#369EAD"
                },
                {
                    title: "Logarithmic Scale",
                    logarithmic: true,
                    lineColor: "#C24642",
                    titleFontColor: "#C24642",
                    labelFontColor: "#C24642"
                }
            ],
            axisY2: [
                {
                    title: "Linear Scale",
                    lineColor: "#7F6084",
                    titleFontColor: "#7F6084",
                    labelFontColor: "#7F6084"
                },
                {
                    title: "Logarithmic Scale",
                    logarithmic: true,
                    interval: 1,
                    lineColor: "#86B402",
                    titleFontColor: "#86B402",
                    labelFontColor: "#86B402"
                }
            ],
            data: dataObjects // Update the data property with the modified dataObjects array
        });



        chart.render();
    }


});
