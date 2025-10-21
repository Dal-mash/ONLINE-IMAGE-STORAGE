import supabase from './client.js';
import express from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import path from 'path';
import { profile } from 'console';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const upload = multer({storage: multer.memoryStorage()});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use( express.static(path.join(__dirname, '..', 'front_end')));

async function uploadImage(buffer, image_name) {
  
    const { data, error } = await supabase.storage
        .from('IMAGES')
        .upload(image_name, buffer, {
            contentType: 'image/png',
            upsert: true
        });
    return { data, error };
}



///////////////////////////////////////////////////
//////     IMAGE UPLOAD ENDPOINT     /////////////////

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).send("No file uploaded");
  const { buffer, originalname } = req.file;

  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("No token provided");

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Error fetching user data:", userError);
      return res.status(500).send("Error fetching user data");
    }

    const user = userData.user;
    const image_name = `${user.id}/${originalname}`;

    // Upload the image
    const { data: uploadData, error: uploadError } = await uploadImage(buffer, image_name);
    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return res.status(500).send("Error uploading image");
    }

    // Get the public URL
    const { data: publicData } = supabase.storage
      .from("IMAGES")
      .getPublicUrl(image_name);

    const imageUrl = publicData.publicUrl;

    // ✅ Fetch or initialize profile safely
    const { data: profileData, error: fetchError } = await supabase
      .from('profiles')
      .select('imageurls')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      return res.status(500).send("Error fetching profile");
    }

    // ✅ Merge URLs correctly even if null or empty
    const existingUrls = Array.isArray(profileData?.imageurls)
      ? profileData.imageurls
      : [];

    const updatedUrls = [...existingUrls, imageUrl];

    // ✅ Use UPSERT — creates row if not exists, updates otherwise
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        imageurls: updatedUrls,
      });

    if (updateError) {
      console.error("Error updating image URLs:", updateError);
      return res.status(500).send("Error updating image URLs");
    }

    return res.status(200).json({
      success: true,
      msg: "Image uploaded and URL added successfully",
      img: imageUrl,
    });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).send("Server error");
  }
});


////DELETE THIS NOW///////
////////////////////////////

app.delete("/delete-image", async (req, res) => {
    // const { url } = req.body;
    // console.log("URL to delete:", url);
    // res.status(200).json({message:"deleted successfully", imageurl:url});

  const imageUrl = req.body?.imageurl || req.query?.imageurl;

  if (!imageUrl) return res.status(400).send({ msg: "Image URL is required" });
  

  try {
    // Get token and verify user
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("No token provided");

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      console.error("Error fetching user data:", userError);
      return res.status(500).send("Error fetching user data");
    }

    const user = userData.user;

    // Get existing image URLs (use maybeSingle to avoid errors if row missing)
    const { data: profileData, error: fetchError } = await supabase
      .from('profiles')
      .select('imageurls')
      .eq('id', user.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error fetching profile:", fetchError);
      return res.status(500).send("Error fetching profile");
    }

    const existingUrls = Array.isArray(profileData?.imageurls) ? profileData.imageurls : [];

    // Remove the specified URL
    const updatedUrls = existingUrls.filter(url => url !== imageUrl);

    // Update the database (use upsert to create row if it doesn't exist)
    const { error: updateError } = await supabase
      .from('profiles')
      .upsert({ id: user.id, imageurls: updatedUrls });

    if (updateError) {
      console.error("Error updating image URLs:", updateError);
      return res.status(500).send("Error updating image URLs");
    }

    // Attempt to remove the file from storage if we can derive the object path from the public URL
    // try {
    //   const parts = imageUrl.split('/IMAGES/');
    //   if (parts.length > 1) {
    //     const pathInBucket = parts[1];
    //     const { data: delData, error: delError } = await supabase.storage
    //       .from('IMAGES')
    //       .remove([pathInBucket]);
    //     if (delError) {
    //       console.warn("Failed to delete storage object:", delError);
    //       // Do not fail the request because of storage deletion issues
    //     }
    //   } else {
    //     // Could not determine storage path from the provided URL
    //     console.warn("Could not derive storage path from imageUrl:", imageUrl);
    //   }
    // } catch (e) {
    //   console.warn("Could not remove file from storage:", e);
    // }

    return res.status(200).send({
      success: true,
      msg: "Image removed successfully",
      imageurl: imageUrl
    });

  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).send("Server error");
  }
});

////////////////////
app.put("/update-pic", upload.single('image'), async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).send("No token provided");

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      console.error(userError);
      return res.sendStatus(404);
    }

    const userId = user.id;

    if (!req.file) return res.status(400).send("No image file uploaded");

    const { originalname, buffer } = req.file;

    // Upload image to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("IMAGES")
      .upload(`public/${userId}/${originalname}`, buffer, {
        upsert: true, 
      });

    if (uploadError) {
      console.error("Error uploading image:", uploadError);
      return res.status(500).send("Error uploading image");
    }


    const { data: publicUrlData } = supabase
      .storage
      .from("IMAGES")
      .getPublicUrl(uploadData.path);

    const imageUrl = publicUrlData.publicUrl;

    // Update user's profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ profilepic_url: imageUrl })
      .eq("id", userId);

    if (updateError) {
      console.error("Error updating profile:", updateError);
      return res.status(500).send("Error updating profile");
    }

    return res.status(200).send({
      message: "Profile picture updated successfully",
      imageUrl,
    });
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).send("Server error");
  }
});

/////////////////////////////////////////
//////// update BIO ///////////////////

app.put("/update-bio", async (req,res)=>{
  try{
    const token = req.headers.authorization.split(" ")[1];
    if (!token) {
            return res.status(401).send({msg: "No token provided"});
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error) {
            console.error("Error fetching user data:", error);
            return res.status(500).send({msg: "Error fetching user data"});
        }
        const {bio} = req.body;
        if(!bio){
          console.error("NO BIO");
          return res.status(405).send({msg: "no BIO"});
        }
        const {data, err} = await supabase
          .from("profiles")
          .update({ Bio: bio })
          .eq("id", user.id);
        if (err) {
          console.error("Error updating bio:", err);
          return res.status(500).send({msg: "Error updating bio"});
        }
        return res.status(200).send({ success: true,  bio });
    } catch (err) {
        console.error("Server error:", err);
        return res.status(500).send({msg: "Server error"});
    }
});



///////////////////////////////////////////////////
// //////     GET PROFILE DATA     /////////////////
// app.get("/profile", async (req, res)=>{
//     try{
//         const token = req.headers.authorization?.split(" ")[1];
//         if (!token) {
//             return res.status(401).send("No token provided");
//         }

//         const { data: { user }, error } = await supabase.auth.getUser(token);
//         if (error) {
//             console.error("Error fetching user data:", error);
//             return res.status(500).send("Error fetching user data");
//         }


//         const {data, err} = await supabase
//             .from('profiles')
//             .select("*")
//             .eq("id", user.id)
//             .single();

            
//         if(err){
//             res.status(500).json({message:"couldnt get data", err})
//         }
//         res.status(200).json({message:" user data gotten successfully", data})
//     }catch(err){
//         res.status(500).json({msg:"server error", err})
//     }
// })

///////////////////////////////////////////////////
//////     SIGN UP     /////////////////

app.post("/sign-up", async (req, res)=>{
    const { username, email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options:{
            data:{
                username: username
            }
        }
    });
    if (error) {
        console.error("Error signing up:", error);
        return res.status(500).send("Error signing up");
    }
    return res.sendStatus(200)
});
////////////////////////////////



//////////////////////////////////////////////////////////////
///////////       LOG IN         ////////////////////

app.post("/sign-in", async (req, res)=>{
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    if (error) {
        console.error("Error signing in:", error);
        return res.status(500).send("Error signing in");
    }
    return res.status(200).json({token:data.session.access_token, userId : data.user.id});    
});
//////////////////////////////////////////


//////////////////////////////////////////////////////////////////
///////      GET HOME PAGE DATA FROM PROFILE      ///////////////


app.get("/user", async (req, res) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.sendStatus(401);
    }

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
        console.error(userError);
        return res.sendStatus(404);
    }

    const userId = user.id;
    const { data, error } = await supabase.storage.listBuckets();
    if (error) {
        console.error(error);
        return res.sendStatus(500);
    }
    console.log("Buckets:", data);
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, imageurls, Bio, profilepic_url')
        .eq('id', userId)
        .single();

    if (profileError) {
        console.error(profileError);
        return res.sendStatus(500);
    }

    return res.status(200).json({
      user: profile.name,
      bio: profile.Bio || "",
      imgurl: profile.profilepic_url || "",
      imageurls: profile.imageurls || []
    });

    
});



//////////////////////////////////////////////////////////////////




app.get("/user-data", async (req, res)=>{
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).send("No token provided");
    }
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error) {
        console.error("Error fetching user data:", error);
        return res.status(500).send("Error fetching user data");
    }
    res.status(200).json({ message: "User data fetched successfully", user });
});

app.get("/sign-out", async (req, res)=>{
    const { error } = await supabase.auth.signOut();
    if (error) {
        console.error("Error signing out:", error);
        return res.status(500).send("Error signing out");
    }
    res.status(200).send("User signed out successfully");
});

app.listen(3000, () => {
    console.log('Server is running on http://localhost:3000');
});




