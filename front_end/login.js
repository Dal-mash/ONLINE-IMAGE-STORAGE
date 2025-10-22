
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
        .catch(err => {
            alert("Login failed. Please check your credentials and try again.");
            console.error(err)});
});

////////SIGN UP FORM
document.getElementById('signupForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const username = document.getElementById('signupName').value;
  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    // Step 1: Sign up
    const signupResponse = await fetch('https://backend-production-fea2.up.railway.app/sign-up', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });

    if (!signupResponse.ok) {
      notify("Sign-up failed. Please try again.", "error");
      return;
    }

    notify("Sign-up successful! Logging you in...", "success");

    // Step 2: Auto-login after signup
    const loginResponse = await fetch('https://backend-production-fea2.up.railway.app/Sign-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const { userId, token } = await loginResponse.json();

    if (token) {
      localStorage.setItem("token", token);
      window.location.href = "./Home/";
    } else {
      notify("No token received. Please log in manually.", "warn");
    }

  } catch (error) {
    console.error("Error during signup/login:", error);
    notify("An unexpected error occurred.", "error");
  }
});
