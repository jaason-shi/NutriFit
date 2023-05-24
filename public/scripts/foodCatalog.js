/**
 * Script file for Food Catalog type pages.
 */

/**
 * Adds an item to the user's meal logs.
 * 
* @param {string} id - the id of the item to add
 */
function addItem(id) {
    var formType = $('#formType').val();

    if (formType === 'quickAddMeal') {
        $.post('./quickAddMeal', { item: id }, function () {
            window.location.href = "/mealTracking/mealLogs";
        });
    } else {
        $.post('./selectFood', { item: id }, function () {
            window.location.href = "./mealFilters";
        });
    }
}


/**
 * Populates the page with data received from a search query.
 * 
 * @param {Array<Object>} data - the list of food items to populate the page with
 */
function populateFoodResults(data) {
    $('#foodResults').empty();
    data.forEach(item => {
        $('#foodResults').append(`

                <div class="container m-0 p-0 border-bottom d-flex align-items-center">
                    <div class="d-inline align-self-center d-flex my-auto" style="width: 40px;">
                        <button class="rounded-circle border-0 m-0 p-0 my-auto"
                            style="height: 30px; width: 30px"></button>
                    </div>

                    <div class="w-50 vstack gap-0">
                        <div class="d-inline-flex">
                            <span>
                                ${item.name}, ${item.measure}
                            </span>

                        </div>
                        <div class="d-inline text-secondary" style="font-size: 14px">
                            ${item.calories} cal
                        </div>
                    </div>

                    <div>
                        <button onclick="addItem('${item.id}')" class="btn btn-light m-0 p-0 ms-auto"><img
                                src="/images/plus-circle.svg" alt="Add" height="30px"></button>
                    </div>
                </div>
                    `);
    });
}


/**
 * Sets up the event listeners for the elements on the page.
 */
function setup() {
    // Search bar event listener
    $('#searchBar').on('input', function () {
        const searchQuery = $(this).val();
        $.get('./searchFood', { q: searchQuery }, (data) => populateFoodResults(data))
    });
}


/**
 * Adds event listeners only when document is fully loaded.
 */
$(document).ready(setup)