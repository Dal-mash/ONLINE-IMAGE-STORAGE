
/////////////////////////////////////
///LOGGINNNNN  FORRMMMMMMU
document.getElementById('loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body:  JSON.stringify({email, password})
    };

    fetch('https://backend-production-fea2.up.railway.app/Sign-in', options)
        .then(response => response.json())
        .then(({userId, token})=>{
            if(token){
                localStorage.setItem("token",token)
                window.location.href = "./Home/";
            }
            else(
                alert("NO TOKEN PROVIDED")
            )
        })
        .catch(err => console.error(err));
});

////////SIGN UP FORM
document.getElementById('signupForm').addEventListener('submit', function(e) {
    let success = false
    e.preventDefault();
    const username = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;

    fetch('https://backend-production-fea2.up.railway.app/sign-up', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, email, password })
    })
    .then(response => {
        if (response.ok) {
            alert('Sign up successful!')
            success = true
        } else {
            alert('Sign up failed.');
            success = false
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Sign up failed.');
    });
    if(success){
        const options = {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body:  JSON.stringify({email, password})
        };
        fetch('https://backend-production-fea2.up.railway.app/Sign-in', options)
        .then(response =>  response.json())
        .then(({userId, token})=>{
            if(token){
                localStorage.setItem("token",token)
                window.location.href = "./Home/";
            }
            else(
                alert("NO TOKEN PROVIDED")
            )
        })
        .catch(err => console.error(err));
    }

});