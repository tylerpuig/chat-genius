// Trigger for new messages

// -- First create the notification function
// CREATE OR REPLACE FUNCTION notify_new_message()
// RETURNS trigger AS $$
// DECLARE
//     channel_members_cursor CURSOR FOR
//         SELECT cm.user_id
//         FROM channel_member cm
//         WHERE cm.channel_id = NEW.channel_id;
//     member_user_id varchar(255);
//     message_data json;
// BEGIN
//     -- Construct the message data
//     message_data := json_build_object(
//         'id', NEW.id,
//         'content', NEW.content,
//         'channelId', NEW.channel_id,
//         'userId', NEW.user_id,
//         'createdAt', NEW.created_at
//     );

//     -- Notify each channel member
//     OPEN channel_members_cursor;
//     LOOP
//         FETCH channel_members_cursor INTO member_user_id;
//         EXIT WHEN NOT FOUND;

//         -- Don't notify the sender
//         IF member_user_id != NEW.user_id THEN
//             PERFORM pg_notify(
//                 'new_message_' || member_user_id,
//                 message_data::text
//             );
//         END IF;
//     END LOOP;
//     CLOSE channel_members_cursor;

//     RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// -- Create the trigger
// CREATE TRIGGER message_inserted
// AFTER INSERT ON message
// FOR EACH ROW
// EXECUTE FUNCTION notify_new_message();
