(function($) {
    var $locForm = $("[data-for='LocationFinder.js']");
    var $submitButtons = $locForm.find('input[type=submit], .submit');
    var $headerFormInput = $locForm.find('input[type=text]');
    var $findMeBtn = $locForm.find('.find-me');
    var $locInput = $('#location');
    var $toGoButtonDelivery = $('#toGoButtonDelivery');
    var $toGoButtonPickUp = $('#toGoButtonPickUp');
    var noGeoMessage = $locForm.attr('data-geocoding-not-available-text');
    var geoErrorMessage = $locForm.attr('data-geocoding-not-available-text');
    var action = $locForm.attr('action');
    var $filterWrapper = $('.filter-wrapper');
    var $userFilters = $filterWrapper.find("*[name='LocationFilters']");
    var thisBrand = $('#segmentID').val();
    var isSecure =
        window.location.protocol === 'https:' ||
            window.location.hostname === 'localhost';
    var supportsGeolocation =
        window &&
            window.location &&
            isSecure &&
            window.navigator &&
            window.navigator.geolocation &&
            $.isFunction(window.navigator.geolocation.getCurrentPosition);

    var austinEateryId = '01fd3b40-706f-42e0-a267-32c6a7bed3cb';
    var carvelId = '{8823DD90-424B-4A83-89AC-5712D4D96E5F}';
    
    $locInput.on('blur',
        function() {
            $(this).attr('placeholder', $(this).attr('data-placeholder'));
        });

    $locInput.on('focus',
        function() {
            $(this).attr('placeholder', '');
        });

    //user input
    $submitButtons.off().on('click',
        function(event) {
            event.preventDefault();
            handleHeaderGo();
        });

    $(document).ready(function() {
        handleCheckUrl();
    });

    $toGoButtonDelivery.on('click',
        function() {
            handleCheckUrl();
        });

    $toGoButtonPickUp.on('click',
        function() {
            handleCheckUrl();
        });

    $locInput.on('focus',
        function() {
            var $errExist = $('.loc-err');
            if ($errExist.length) {
                $locForm.find('.error-label').remove();
            }
        });

    // Show validation when the user
    // hits enter in the location field
    $locInput.on('keyup',
        function(e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                if (!$(this).val()) {
                    var $placeholder = $locForm.find('.ph');
                    $placeholder.css('display', 'none');
                    var err = getErrorElement();
                    $locForm.find('.loc-input-wrapper').prepend(err);
                    return false;
                }
            }

            return true;
        });

    if (supportsGeolocation) {
        $findMeBtn.on('click',
            function(e) {
                e.preventDefault();
                $findMeBtn.addClass('sp-circle');
                getPositionFromGeolocation();
            });
    }

    //FIND ME
    function getPositionFromGeolocation() {
        console.warn('NEW getPositionFromGeolocation navigator.geolocation', window.navigator.geolocation);

        function success(position) {
            var hasLatLng =
                position &&
                    position.coords &&
                    position.coords.latitude &&
                    position.coords.longitude;

            if (hasLatLng) {
                useFilters().done(function(filterUri) {
                    console.log('FINDER useFilters().done()', filterUri);
                    window.location.href =
                        action +
                        '?AddressLatitude=' +
                        position.coords.latitude +
                        '&AddressLongitude=' +
                        position.coords.longitude +
                        filterUri;

                });
            } else {
                alert(geoErrorMessage);
            }
        }

        function error() {
            alert(geoErrorMessage);
        }

        navigator.geolocation.getCurrentPosition(success, error);
    }

    function getSelectedFilterValue($filter) {
        var filterString = '';
        if ($filter.attr('id') === 'OpenNow' || $filter.attr('id') === 'FoodTruck') {
            console.warn('WE HAVE OPEN NOW OR FOOD TRUCK');
            if ($filter.attr('id') === 'OpenNow') {
                filterString += '&OpenNow=true';
            }

            if ($filter.attr('id') === 'FoodTruck') {
                filterString += '&FoodTruck=true';
            }

            if ($filter.attr('id') === austinEateryId) {
                filterString += '&LocationFilters=' + $filter.val();
            }
        } else if ($filter.attr('name') !== 'LocationFilters') {
            filterString += '&LocationServices=' + $filter.val();
        }

        if ($filter.attr('name') === 'LocationFilters') {
            if ($filter.attr('id').toString() === austinEateryId) {
                filterString += '&LocationFilters=' + $filter.val();
            }
        }

        return filterString;
    }

    function getUserFilterValues($filter) {
        if ($filter.attr('name') === 'LocationFilters') {
            if ($filter.attr('id').toString() !== austinEateryId) {
                return '&userfilters=' + $userFilters.val();
            }
        }

        return '';
    }

    //FILTERS
    function useFilters() {
        var deferred = new $.Deferred();
        var $checkedFilters = $filterWrapper.find('input:checked');
        var filterString = '';
        var userFilters = '';
        $checkedFilters.each(function() {
            var $filter = $(this);
            console.warn('looping filters', $filter.attr('id'));
            filterString += getSelectedFilterValue($filter);
            var currentUserFilters = getUserFilterValues($filter);
            if (currentUserFilters) userFilters = currentUserFilters;
        });

        console.warn('filterString', filterString);
        var resultFilterUri = filterString + userFilters;
        deferred.resolve(resultFilterUri);

        return deferred.promise(resultFilterUri);
    }

    //HEADER GO WITH INPUT
    function handleHeaderGo() {
        console.warn('****handleHeaderGo');
        if (locFormValidate()) {
            useFilters().done(function(filterUri) {
                var headerInput = $headerFormInput.val();
                window.location.href = action + '?location=' + headerInput + filterUri;
            });
        }
    }

    //VALIDATE HEADER FORM
    function locFormValidate() {
        var $errorLabels = $locForm.find('.error-label');

        if ($locInput.val()) {
            console.warn('INPUT HAS VALUE');
            $errorLabels.remove();
            return true;
        }

        if (!$errorLabels.length) {
            var err = getErrorElement();
            $(err).insertAfter($locInput);
        }

        return false;
    }

    function getErrorElement() {
        var locFormErrorTxt = $('#locationFormError').val();
        var err;
        if (locFormErrorTxt) {
            err = '<span class="error-label err">' + locFormErrorTxt + '</span>';
        } else {
            err = '<span class="error-label err">' + 'Please enter your search terms' + '</span>';
        }

        return err;
    }

    function handleCheckUrl() {
        if (thisBrand !== carvelId) {
            return;
        }

        var currentUrl = window.location.href;
        if (currentUrl.indexOf('?filters=') >= 0) {
            var filters = (currentUrl.split('=')[1] || '').split('&');
            console.log(filters);
            filters.forEach(function(element) {
                console.log(element);
                if (element && window.location.href.indexOf(element) >= 0) {
                    document.getElementById(element).checked = true;
                }
            });

            $('#location-form').parent().css({ "display": 'block' });
        }
    }

    console.warn('new finder start', $submitButtons, $locForm, noGeoMessage, geoErrorMessage, action);

})(jQuery);