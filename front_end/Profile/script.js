document.addEventListener('DOMContentLoaded', () => {
  // Initialize everything
  getProfileData();
  setupCommentEditor();
  setupImageUpload();
});


// --------------------
// 🧩 Fetch Profile Data
// --------------------
function getProfileData() {
  const token = localStorage.getItem('token');
  if (isTokenExpired(token)) {
    alert('Session expired. Please log in again.');
    window.location.href = '../index.html';
    return;
  }

  fetch('https://backend-production-fea2.up.railway.app/user', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then(response => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then(data => {
      document.getElementById('bioDisplay').innerText = data.bio || '';

      // only show image if valid url exists
      if (data.imgurl && data.imgurl !== '') {
        const img = document.createElement('img');
        img.id = 'profileImage';
        img.src = data.imgurl;
        document.getElementById('profile-pic-container').appendChild(img);
      }

      document.getElementById('card-username').innerText = data.user || '';
    })
    .catch(error => {
      console.error('Error fetching profile:', error);
    });
}


// ----------------------------
// 💬 Comment / Bio Editor Logic
// ----------------------------
function setupCommentEditor() {
  const commentButton = document.querySelector('.comment-button');
  const editContainer = document.querySelector('.edit-container');
  const saveButton = document.getElementById('bioSubmit');

  if (!commentButton || !editContainer) return;

  // Toggle the edit panel
  commentButton.addEventListener('click', e => {
    e.preventDefault();
    editContainer.classList.toggle('is-open');
  });

  // Save button logic
  if (saveButton) {
    let bioText = "";
    saveButton.addEventListener('click', () => {
      bioText = document.getElementById('bio').value;
      if (editContainer.classList.contains('is-open')) {
        editContainer.classList.remove('is-open');
      }

      const token = localStorage.getItem('token');
      if (isTokenExpired(token)) {
        alert('Session expired. Please log in again.');
        return;
      }

      console.log(bioText)
      fetch('https://backend-production-fea2.up.railway.app/update-bio', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ bio: bioText }),
      })
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(data => {
          if (data.bio) {
            document.getElementById('bioDisplay').innerText = data.bio;
          }
        })
        .catch(error => console.error('Error updating bio:', error));
    });
  }
}


// ---------------------
// 🖼️ Profile Image Upload
// ---------------------
function setupImageUpload() {
  const uploadBtn = document.getElementById('uploadBtn');
  const imageInput = document.getElementById('imageInput');

  if (!uploadBtn || !imageInput) return;

  uploadBtn.addEventListener('click', () => imageInput.click());

  imageInput.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append('image', file);

    const token = localStorage.getItem('token');
    if (isTokenExpired(token)) {
      alert('Session expired. Please log in again.');
      return;
    }

    fetch('https://backend-production-fea2.up.railway.app/update-pic', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: form,
    })
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.json();
      })
      .then(data => {
        if (data.imageUrl) {
          let img = document.getElementById('profileImage');
          if (img) {
            img.src = data.imageUrl;
          } else {
            const imgElement = document.createElement('img');
            imgElement.id = 'profileImage';
            imgElement.src = data.imageUrl;
            document
              .getElementById('profile-pic-container')
              .appendChild(imgElement);
          }
        }
      })
      .catch(error => console.error('Error uploading image:', error));
  });
}


// -----------------
// ⏱️ Token Expiration
// -----------------
function isTokenExpired(token) {
  if (!token) return true;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    return payload.exp < now;
  } catch (e) {
    console.error('Invalid token:', e);
    return true;
  }
}
document.getElementById('logBtn').addEventListener("click",()=>{
    localStorage.clear()
    window.location.href = "../index.html";

})
document.getElementById('homeBtn').addEventListener("click",()=>{
    window.location.href = "../Home/";

})

