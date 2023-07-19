/// <reference path="jquery-3.7.0.js" />
"use strict";

$(() => {
    // Defines the variables outside in case we want to reset the graph:

    let intervalId;     // Declare the intervalId variable outside of the handleHome function
    let coinData = [];  // Declare the coinData variable outside of the handleHome function
    // Defines a variable that will count the number of columns:
    let counter = 0;
    let chart; // Declare the chart variable outside of the handleHome() function
    handleHome();  //Brings up the home page when opening the website

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

    $("#homeLink").click(async () => {
        preparingToHome();
        let selectedCoinsList = getSelectedCoinNames();
        await handleHome();
        for (let i = 0; i < selectedCoinsList.length; i++) {
            toggleCoin(selectedCoinsList[i]);
        }
    });

    $("#reportsLink").click(() => {
        // Hides the search bar on the reports page:
        $("#searchRow").hide();
        handleReports();
    });

    $("#aboutLink").click(() => {
        // Hides the search bar on the about page:
        $("#searchRow").hide();
        // Clears the comment on the empty graph just in case and the user returns to the home page
        $("#errorLiveReports").html("");
        // Empty the selected coins list in the top of the page:
        $("#selectedCoinsListShowToUser").text("");
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
        const coins = await getJson("https://api.coingecko.com/api/v3/coins/list");
        displayCoins(coins);
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

    //Handles the "More Info" button click event:
    async function handleMoreInfo(coinId) {
        if (localStorage.getItem(coinId) === null) {
            const coin = await getJson("https://api.coingecko.com/api/v3/coins/" + coinId);

            // Define that if the data is invalid the user will see empty string and not "undefined":
            const imageSource = coin.image?.thumb || "";
            const usd = coin.market_data.current_price?.usd || "";
            const eur = coin.market_data.current_price?.eur || "";
            const ils = coin.market_data.current_price?.ils || "";

            const moreInfo = `
            <img src="${imageSource}"> <br>
            USD: $${usd} <br>
            EUR: Є${eur} <br>
            ILS: ₪${ils}   `;

            $(`#collapse_${coinId}`).html(moreInfo);
            // Insert the Data to the local storage:
            localStorage.setItem(`${coinId}`, JSON.stringify({
                imageSource,
                usd,
                eur,
                ils
            }));

            // Remove data from local storage after 2 minutes:
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

            // Clear the existing content of the collapsible element:
            $(`.${coinId}`).empty();
            // Update the collapsible element with the new HTML content:
            $(`.${coinId}`).append(storedInfo);
        }
    }

    // Fetches JSON data from the specified URL.
    async function getJson(url) {
        try {
            const response = await fetch(url);    // Send a request to the provided URL
            const json = await response.json();   // Parse the response body as JSON
            return json;    // Return the parsed JSON object
        } catch (error) {
            //Clear the selected coins list displayed to the user:
            $("#selectedCoinsListShowToUser").text("");
            // Display an error message for server communication:
            $("#errorWithApi").text("There is an error in contacting the server");
        }
    }

    $("#search-btn").click(() => {
        // Change the value of the search to capital letters because later we will compare it to the ID in capital letters:
        const searchInput = $("#search-input").val().toUpperCase();
        if (searchInput === "") {
            $("#errorSearchContainer").html("Please enter a valid coin name to search.");
            return;
        }

        let coinFound = false; // Flag to track if the coin is found

        // Looking for the ID among all coins:
        $(".card").each(function () {
            // Get the ID attribute of the current card:
            const cardId = $(this).attr("id");
            if (cardId && cardId.toUpperCase() === searchInput) {
                // Show the card if its ID matches the search input (case-insensitive):
                $(this).show();
                coinFound = true;   // Set the coinFound flag to true
            }
            else
                $(this).hide();

            if (!coinFound)
                $("#errorSearchContainer").html("Please enter a valid coin name to search.");   // Display an error message if no coin is found
            else
                $("#errorSearchContainer").html(""); // Clear the error message if a coin is found
        })

        // Empty the search box
        $("#search-input").val("");
    });

    function displayModalDialog() {
        const modal = $("#myModal");
        const selectedCoinsList = $("#selectedCoinsList");
        const cancelCurrencySelect = $("#cancelCurrencySelect");

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
        //display to the user the selected coins:
        const selectedCoinsNames = getSelectedCoinNames();
        if (selectedCoinsNames.length === 0)
            $("#selectedCoinsListShowToUser").text("No marked coins");
        else
            $("#selectedCoinsListShowToUser").text("Selected Coins:" + selectedCoinsNames);

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
    });

    $("#cancelCurrencyBtn").click(function () {
        let selectedCoinToCancel = $("#cancelCurrencySelect").val();
        // Find the corresponding toggle switch for the canceled currency
        toggleCoin(selectedCoinToCancel);

        $("#myModal").modal("hide");
        // Store the selected coin in a variable
        const selectedCoin = $("#cancelCurrencySelect option:selected").text();
        // toggle again the sixth coin we want to add:
        toggleCoin(sixCoinNameToAdd);
    });

    function toggleCoin(coinName) {
        // Find the checkbox for the specified coin name:
        const checkbox = $(`#${coinName} .toggle-card`);
        // Get the current state of the checkbox:
        const currentState = checkbox.prop("checked");
        // Toggle the state of the checkbox:
        checkbox.prop("checked", !currentState);
        // Trigger the change event to update the checkbox state:
        checkbox.trigger("change");
    }

    $("#keepSelectionBtn").click(() => {
        const lastSelectedCoin = $(".toggle-card:checked").last();
        // Find coin name:
        const coinName = lastSelectedCoin.closest(".card").find(".card-title").text();
        //hide model:
        $("#myModal").modal("hide");
    })

    function getSelectedCoinNames() {
        const selectedCoinNames = [];
        $(".toggle-card:checked").each(function () {
            const coinName = $(this).closest(".card").find(".card-title").text();
            selectedCoinNames.push(coinName);
        });
        return selectedCoinNames;
    }

    function handleReports() {
        // Clears the graph just in case and the user will return from the real-time reports screen to the home screen:
        cleanup();

        const selectedCoins = getSelectedCoinNames();
        if (selectedCoins.length === 0) {
            $("#errorLiveReports").html("&nbsp; You must select at least one currency to see a graph!");
            // Hides the loading gif if the user has not selected a currency
            $("#loadingGifContainer").hide();
            // Hides the graph if the user has not selected a currency
            $("#chartContainer").hide();
            return;
        }

        // Convert the array of selected coin names to a new array:
        let coinsToShow = selectedCoins.map(coin => coin);
        // Join the elements of the coinsToShow array into a single string separated by commas:
        let coinsId = coinsToShow.join();

        intervalId = setInterval(function () {
            getReportData(coinsId, function (data) {
                if (data["Response"] === "Error") {
                    alert("Error..");
                    cleanup(); //Clear the interval if we get an error
                    return;
                }
                // Shows the graph and the loading gif again if we closed them due to some error
                $("#loadingGifContainer").show();
                $("#chartContainer").show();

                for (let coin in data) {
                    // Check if coinData for the current coin exists, if not, create an empty array for it
                    if (!coinData[coin]) {
                        coinData[coin] = [];
                    }

                    // Push a new data point to the coinData array for the current coin
                    coinData[coin].push({ x: new Date(), y: data[coin]["USD"] });
                }
                // Render the updated chart with the coinData:
                renderChart(coinData);
                // Hide the loading GIF after data is updated:
                $("#loadingGifContainer").hide();
            });
        }, 2000)
    }

    // This function resets the graph:
    function cleanup() {
        clearInterval(intervalId); // Clear the interval
        coinData = []; // Reset the coinData object
        counter = 0;    //Rest the counter of the columns
    }

    // Get data of coins checked by the user
    async function getReportData(symbols, callback) {
        const response = await fetch(`https://min-api.cryptocompare.com/data/pricemulti?fsyms=${symbols}&tsyms=usd`);
        const data = await response.json();
        callback(data);
    }

    const numOfColumnsInTheChart = 10;
    function renderChart(coinsData) {
        let dataObjects = [];

        for (let coin in coinsData) {
            // Limits the amount of columns in the graph to 10 columns:
            if (counter > numOfColumnsInTheChart && coinsData[coin] !== null && coinsData[coin] !== undefined)
                coinsData[coin].shift();    //Deletes the first column after we reach the limit

            dataObjects.push({
                type: "spline",
                showInLegend: true,
                name: coin,
                dataPoints: coinsData[coin]
            });
        }
        // Increases the counter by 1 outside the loop every time we have completed a round of a column in the graph:
        counter++;
        // Create a new instance of the CanvasJS chart:
        chart = new CanvasJS.Chart("chartContainer", {
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
        chart.options.data = dataObjects; // Update the data property with the modified dataObjects array
        chart.render();
    }

    // This function makes the necessary preparations and clears the page before calling to handleHome
    function preparingToHome() {
        // Shows the search bar (in case we come from pages reports/about)
        $("#searchRow").show();
        // Empty the error div in case the user gets an error and then presses the home button again
        $("#errorSearchContainer").html("");
        // Clears the comment on the empty graph just in case and the user returns to the home page
        $("#errorLiveReports").html("");
        cleanup();
    }
});
