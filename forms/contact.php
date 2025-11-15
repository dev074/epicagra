<?php
// Use these namespaces at the top of the file
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\SMTP;

// --- STEP 1: LOAD PHPMailer MANUALLY ---
// We are pointing to the files we downloaded and placed in the PHPMailer folder.
// The '../' goes up one level from the 'forms' directory to the main 'Epicagra' directory.
require '../PHPMailer/src/Exception.php';
require '../PHPMailer/src/PHPMailer.php';
require '../PHPMailer/src/SMTP.php';

// Check if the form was submitted using POST
if ($_SERVER['REQUEST_METHOD'] === 'POST') {

    // --- STEP 2: SANITIZE AND GET FORM DATA ---
    $name     = htmlspecialchars(trim($_POST['name']));
    $mobile   = htmlspecialchars(trim($_POST['mobile']));
    $email    = filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL);
    $message  = htmlspecialchars(trim($_POST['message']));
    $meetingTime  = htmlspecialchars(trim($_POST['meeting-time']));
    $services_string = 'Not specified';
    if (!empty($_POST['services']) && is_array($_POST['services'])) {
        $services = array_map('htmlspecialchars', $_POST['services']);
        $services_string = implode(', ', $services);
    }

    // Basic server-side validation
    if (empty($name) || empty($mobile) || !filter_var($email, FILTER_VALIDATE_EMAIL) || empty($meetingTime)) {
        http_response_code(400); // Bad Request
        die('Please fill out all fields correctly.');
    }

    // --- STEP 3: CONFIGURE AND SEND THE EMAIL ---
    $mail = new PHPMailer(true);

    try {
        // --- Server settings (This is the Gmail SMTP configuration) ---
        $mail->isSMTP();
        $mail->Host       = 'smtp.gmail.com';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'info@epicagra.com';          // Your full Gmail address
        $mail->Password   = 'ggdj rmgc kpmx suqd'; // *** PASTE THE APP PASSWORD HERE ***
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;    // Use SSL
        $mail->Port       = 465;                            // Port for SSL

        // --- Recipients ---
        $mail->setFrom($email, $name); // Sets the "From" address to the user who filled the form
        $mail->addAddress('info@epicagra.com', 'Epicagra Website'); // The email address that will receive the message

        // --- Content ---
        $mail->isHTML(true); // Set email format to HTML
        $mail->Subject = 'New Contact Form Submission from ' . $name;
        $mail->Body    = "<h3>New Message from Epicagra Website</h3>
                          <p><strong>Name:</strong> {$name}</p>
                          <p><strong>Mobile:</strong> {$mobile}</p>
                          <p><strong>Email:</strong> <a href='mailto:{$email}'>{$email}</a></p>
                          <p><strong>Services of Interest:</strong> {$services_string}</p>
                          <p><strong>Requested Meeting Time:</strong> {$meetingTime}</p>
                          <hr>
                          <p><strong>Message:</strong><br>" . nl2br($message) . "</p>";
        $mail->AltBody = "Name: {$name}\nMobile: {$mobile}\nEmail: {$email}\nServices: {$services_string}nRequested Meeting Time: {$meetingTime}\n\nMessage:\n{$message}";

        $mail->send();

        // THIS IS THE SUCCESS RESPONSE. The 'validate.js' is waiting for this exact 'OK' text.
        echo 'OK';

    } catch (Exception $e) {
        // If it fails, send an error message back to the 'validate.js' script.
        http_response_code(500);
        echo "Message could not be sent. Mailer Error: {$mail->ErrorInfo}";
    }

} else {
    // Block direct access to the script
    http_response_code(403);
    echo 'There was a problem with your submission, please try again.';
}
?>