/**
 * Script file for Exercise Catalog type pages
 */


function addItem(id) {
    $.post('/selectExercise', { item: id }, function () {
        window.location.href = "/workoutFilters";
    })
}

const setup = () => {
    // Search bar event listener
    $('#searchBar').on('input', function () {
        const searchQuery = $(this).val();
        $.get('/searchExercise', { q: searchQuery }, function (data) {
            $('#exerciseResults').empty();
            data.forEach(item => {
                $('#exerciseResults').append(`
                    <div class="card">
                        <div class="row no-gutters">
                            <div class="col-md-8">
                                <div class="card-body">
                                    <h5 class="card-title">${item.name}</h5>
                                    <p class="card-text">${item.bodyPart}</p>
                                </div>
                            </div>
                            <div class="col-md-4">
                                <button onclick="addItem('${item.id}')" class="btn btn rounded-pill btn-dark mt-4">Add</button>
                            </div>
                        </div>
                    </div>
                    `);
            });
        })
    });
}


$(document).ready(setup)