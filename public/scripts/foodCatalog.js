/**
 * Script file for Food Catalog type pages
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

const setup = () => {
    console.log("Hello world")
    // Search bar event listener
    $('#searchBar').on('input', function () {
        const searchQuery = $(this).val();
        $.get('./searchFood', { q: searchQuery }, function (data) {
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
        })
    });
}


$(document).ready(setup)