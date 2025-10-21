let fetchedImages = [];

let imageContainer =  document.getElementById("images");

//logout button
document.getElementById('logBtn').addEventListener("click",()=>{
    localStorage.clear()
    window.location.href = "../index.html";

})


//update image gallery
function updateImages(){
    imageContainer.innerHTML = "";
    if(fetchedImages.length === 0){
        imageContainer.innerHTML = "<p>No images uploaded yet.</p>";
        return;
    }

    fetchedImages.forEach(image => {
        const imgElement = document.createElement("img");
        imgElement.src = image;
        imgElement.alt = "alt image";
        imgElement.classList.add("uploaded-image");
    imageContainer.appendChild(imgElement);
    });
    console.log("Images updated");
}

/// ADD TO GALLERY
function addToGallery(image) {
    const imgElement = document.createElement("img");
    imgElement.src = image;
    imgElement.alt = "alt image";
    imgElement.classList.add("uploaded-image");
  imageContainer.appendChild(imgElement);
}

// Modal viewer
function openImageModal(src) {
  // prevent multiple modals
  if (document.querySelector('.image-modal')) return;

  // create overlay
  const overlay = document.createElement('div');
  overlay.className = 'image-overlay';

  const modal = document.createElement('div');
  modal.className = 'image-modal';

  const closeBtn = document.createElement('button');
  closeBtn.className = 'image-close';
  closeBtn.innerHTML = '&times;';
  closeBtn.setAttribute('aria-label', 'Close image');

  // create a Delete button (no functionality - interactive only)
  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'image-delete';
  deleteBtn.innerText = '';
  deleteBtn.setAttribute('aria-label', 'Delete image');
  // add tooltip text
  deleteBtn.title = 'Delete image';
  // add a small trash icon (inline SVG) to the delete button for visual clarity
  deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 6h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M14 11v6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' + deleteBtn.innerHTML;

  const img = document.createElement('img');  
  img.src = src;
  img.className = 'image-full';
  img.alt = '';
  // JS fallback: enforce viewport-based constraints in case some browsers ignore CSS
  img.style.maxWidth = 'calc(100vw - 96px)';
  img.style.maxHeight = 'calc(100vh - 96px)';
  img.style.objectFit = 'contain';

  // container for side controls (close/delete) - will be appended to overlay so it's outside the frame
  const ctrl = document.createElement('div');
  ctrl.className = 'image-controls';
  ctrl.appendChild(deleteBtn);
  ctrl.appendChild(closeBtn);
  // wrap image in a scrollable frame to ensure very large images never overflow
  const frame = document.createElement('div');
  frame.className = 'image-frame';
  frame.appendChild(img);
  modal.appendChild(frame);
  overlay.appendChild(modal);
  // append controls to overlay so they sit to the right of the modal/frame
  overlay.appendChild(ctrl);
  document.body.appendChild(overlay);
  // trigger enter animation
  requestAnimationFrame(() => overlay.classList.add('open'));
  // lock scroll and mark inert; set aria-modal to help older browsers/styles
  document.body.style.overflow = 'hidden';
  const mainEl = document.querySelector('main');
  if (mainEl) mainEl.inert = true;
  document.body.setAttribute('aria-modal', 'true');

  // remember previously focused element to restore when modal closes
  const previousActive = document.activeElement;

  function close() {
    // Play closing animation then remove
    overlay.classList.add('closing');
    overlay.classList.remove('open');
    const cleanup = () => {
      if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
      document.body.style.overflow = '';
      if (mainEl) mainEl.inert = false;
      document.body.removeAttribute('aria-modal');
      document.removeEventListener('keydown', onKey);
      if (previousActive && previousActive.focus) previousActive.focus();
      if (modal && modal.removeEventListener) modal.removeEventListener('transitionend', onTransition);
    };
    // Wait for the modal's transition to finish, fallback to timeout
      function onTransition(e) {
        // ensure the transition event is from the modal (not other elements)
        if (e.target.classList && e.target.classList.contains('image-modal')) cleanup();
      }
  modal.addEventListener('transitionend', onTransition);
    // safety fallback
    setTimeout(cleanup, 350);
  }

  closeBtn.addEventListener('click', (e) => { console.log('closeBtn click'); e.stopPropagation(); close(); });
  // also listen for pointer and touch to improve responsiveness on mobile/touch devices
  closeBtn.addEventListener('pointerdown', (e) => { console.log('closeBtn pointerdown'); e.stopPropagation(); close(); });
  closeBtn.addEventListener('touchstart', (e) => { console.log('closeBtn touchstart'); e.preventDefault(); e.stopPropagation(); close(); }, {passive:false});
  // do NOT close on overlay click per request; prevent clicks falling through
    overlay.addEventListener('click', (e) => {
    if (e.target === overlay) e.stopPropagation();
  });

  function onKey(e){
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);

  // focus close button for accessibility
  closeBtn.focus();



  ///////////////// Delete button functionality //////////////////////

  // Delete button behavior: close modal then send delete request with image URL
  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    // optimistic UI: close modal immediately
    try {
      // reuse close logic by calling close()
      close();
    } catch (err) {
      console.error('Error closing modal before delete request', err);
    }

    // send delete request in background
    try {
      const token = localStorage.getItem("token")
      if(isTokenExpired(token)){
          alert("Token Expired Re-Login")
          window.location.href = "../index.html"
          return
      }
      let res = await fetch('https://backend-production-fea2.up.railway.app/delete-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json; charset=utf-8', 'Authorization': 'Bearer ' + token },
        // send the property name your server expects (use "imageurl" instead of "url")
        body: JSON.stringify({ imageurl: src })
      });

      if (!res.ok) {
        // attempt to read body safely (text fallback) so we don't throw when there's no JSON
        let errBody;
        try { errBody = await res.text(); } catch (e) { errBody = res.statusText; }
        console.error('Delete request failed', res.status, errBody);
        // optionally notify the user with more detail
        alert('Delete request failed: ' + res.status + (errBody ? ' - ' + errBody : ''));
      }
      else {
        const data = await res.json();
        alert('Image deleted successfully: ' + data.imageurl);
        console.log(data.imageurl);
        // remove image from gallery
        fetchedImages = fetchedImages.filter(imgUrl => imgUrl !== data.imageurl);
        const imgToRemove = imageContainer.querySelector('img[src="' + data.imageurl + '"]');
        if (imgToRemove) {
          imageContainer.removeChild(imgToRemove);
        }
      }
    } catch (err) {
      console.error('Error sending delete request', err);
      alert('Error sending delete request');
    }
  });
}

// Delegate clicks on images to open modal
imageContainer.addEventListener('click', (e) => {
  const img = e.target.closest('img');
  if (!img) return;
  openImageModal(img.src);
});

// Fallback: global delegated handler to force-close overlay if close button's local handler fails
document.addEventListener('click', function delegatedClose(e) {
  const btn = e.target.closest && e.target.closest('.image-close');
  if (!btn) return;
  console.log('delegatedClose caught click on .image-close');
  // find any open overlay(s)
  const overlays = document.querySelectorAll('.image-overlay');
  overlays.forEach(overlay => {
    try {
      // remove immediately (avoid waiting for animations if handler broken)
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    } catch (err) {
      console.error('Error removing overlay', err);
    }
  });
  // restore body state
  document.body.style.overflow = '';
  const mainEl = document.querySelector('main');
  if (mainEl) mainEl.inert = false;
  document.body.removeAttribute('aria-modal');
  // prevent other handlers from running
  e.stopPropagation();
  e.preventDefault && e.preventDefault();
});



let h1 = document.getElementById("usr")

//// FETCH USER and data ////
const token = localStorage.getItem("token")
if(isTokenExpired(token)){
    alert("Token Expired Re-Login")
    window.location.href = "../index.html"
}
else{
    fetch('https://backend-production-fea2.up.railway.app/user', {   
    method: 'GET',
    headers: {
        Authorization: "Bearer " + token
        }
    })
    .then(async response => {
      if (response.status === 404) {
        alert("USER ERROR");
        return;
      } else if (response.status === 500) {
        alert("SERVER ERROR");
        return;
      } else if (!response.ok) {
        alert("Unexpected error: " + response.status);
        return;
      }

      const res = await response.json();
      fetchedImages = res.imageurls || [];
      if(fetchedImages.length === 0){
        console.log("No images found");
      }
      if(res.imgurl){
        document.getElementById('profile-img').src = res.imgurl;
      }
      updateImages();
    })
    .catch(err => console.error(err));
}



//////////////////////////////////////////
///     IMAGE UPLOAD         ///////////////////

function handleImageUpload(input) {
  if (input.files && input.files[0]) {
    
    const file = input.files[0];
    const formData = new FormData();
    formData.append('image', file);

    fetch('https://backend-production-fea2.up.railway.app/upload', {
      method: 'POST',
      headers: {
      Authorization: "Bearer " + localStorage.getItem("token")
      },
      body: formData
    })
    .then(response => {
      if (!response.ok) {
      alert("Image upload failed: " + response.status);
      return;
      }
      return response.json();
    })
    .then(data => {
      if (data && data.success) {
        alert("image Uploaded");
        fetchedImages.push(data.img);
        addToGallery(data.img)
      }
    })
    .catch(err => {
      console.error(err);
      alert("Error uploading image.");
    });

    
    input.value = ""; 
    // updateImages();

    }
  }


function isTokenExpired(token) {
  if (!token) return true

  const payload = JSON.parse(atob(token.split('.')[1]))
  const now = Math.floor(Date.now() / 1000)

  return payload.exp < now; 
}
function callProfilePage(){
  window.location.href = "../Profile/"
}