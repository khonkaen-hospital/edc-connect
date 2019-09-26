const Swal = require('sweetalert2')

error =  (title, timer = 1500) => {
    Swal.fire({
        type: 'error',
        title: title,
    })
}

success =  (title, timer = 1500) => {
    Swal.fire({
        type: 'success',
        title: title,
        showConfirmButton: false,
        timer: timer
    })
}

info =  (title, timer = 1500) => {
    Swal.fire({
        type: 'info',
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
        allowEscapeKey: true,
        onBeforeOpen: () => {
            Swal.showLoading()
        }
    })
}

confirm =  (title,text, type='warning', buttonText='Yes!') => {
    return new Promise((resolve, reject) => {
        Swal.fire({
            title: title,
            text: text,
            type: type,
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: buttonText
        }).then(result => {
            if (result.value) {
                resolve(true)
            } else {
                resolve(false)
            }
        })
    })
}

module.exports = {
    loading: loading,
    success: success,
    error: error,
    info: info,
    confirm: confirm
}