# Hands Talk

#### Product Description
Our Hands Talk website aims to teach people the American Sign Language (ASL). It shows the hand sign for each letter of the English alphabet. The flashcards help to memorize each hand sign and check knowledge. The Quiz challenges a user to show a hand sign corresponding to the given letter. This allows for live feedback on the user's learned skills. The site motivates learning by increasing the user's rank as they master ASL.

#### Tech Stack
The tech stack used in the website includes:
<ul>
    <li style="margin-bottom: 10px;">Front End with HTML, CSS, and JavaScript</li>
    <li style="margin-bottom: 10px;">Back End with Python and Flask</li>
    <li style="margin-bottom: 10px;">SQLite database</li>
    <li style="margin-bottom: 10px;">OpenCV, MediaPipe, Numpy, Argon2, Pickle, and scikit-learn libraries</li>
    <li>Render hosting platform for deployment</li>
</ul>

#### Link to Live Site
The Hands Talk URL: https://asl-learner.onrender.com/

#### One Technical Challenge We Faced
One technical challenge we faced was to achieve a high enough accuracy on the recognition of hand signs shown to the web camera. We experimented with different AI models, such as CNN using different ASL datasets, however, the recognition remained poor. The solution was to create our own ASL dataset, highlight landmarks on the hand images using MediaPipe, and use a Random Forest machine learning algorithm from scikit-learn. We showed a hand sign to the camera and collected 100 images for each sign. This formed our dataset. For our recognition model, we first preprocessed all of the images in our dataset by collecting landmarks on each image using MediaPipe. Then, using the collected landmarks, we trained the model with the Random Forest algorithm as it performs best with small datasets and structured data (landmarks). Finally, we saved the model using Pickle and put it on our webserver to recognize hand signs from images taken by the user in the Quiz section.

#### One Thing We Would Improve
One thing we would improve is to add more motivation for users of the website to learn ASL. The base motivation we have currently is to promote users to higher ranks as they make progress in their ASL learning, namely perform better on the Quiz. Additional motivation could be to make the rank of each user public and create a leaderboard to encourage competition and to show off achievements.