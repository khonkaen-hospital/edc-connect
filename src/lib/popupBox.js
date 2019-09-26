const Swal = require('sweetalert2')

success =  (title, timer = 1500) => {
    Swal.fire({
        type: 'success',
        title: title,
        showConfirmButton: false,
        timer: timer
    })
}

loading =  (title) => {
    Swal.fire({
        title: title,
        showConfirmButton: false,
        allowOutsideClick: false,
        allowEscapeKey: false,
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    })
}

module.exports = {
    loading: loading,
    success: success
}