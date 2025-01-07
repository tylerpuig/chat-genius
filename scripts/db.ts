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

// delete tables
// DROP TABLE IF EXISTS "account", "channel", "channel_member", "session", "user", "verification_token", "message" CASCADE;

// -- First create the notification function for reactions
// CREATE OR REPLACE FUNCTION notify_message_reaction()
// RETURNS trigger AS $$
// DECLARE
//     channel_members_cursor CURSOR FOR
//         SELECT DISTINCT cm.user_id
//         FROM channel_member cm
//         JOIN message m ON m.channel_id = cm.channel_id
//         WHERE m.id = NEW.message_id;
//     member_user_id varchar(255);
//     reaction_data json;
//     message_channel_id integer;
// BEGIN
//     -- Get the channel_id for this message
//     SELECT channel_id INTO message_channel_id
//     FROM message
//     WHERE id = NEW.message_id;

//     -- Construct the reaction data
//     reaction_data := json_build_object(
//         'messageId', NEW.message_id,
//         'userId', NEW.user_id,
//         'emoji', NEW.emoji,
//         'channelId', message_channel_id,
//         'type', TG_OP  -- This will be 'INSERT' or 'DELETE' depending on the operation
//     );

//     -- Notify each channel member
//     OPEN channel_members_cursor;
//     LOOP
//         FETCH channel_members_cursor INTO member_user_id;
//         EXIT WHEN NOT FOUND;

//         -- Don't notify the reactor
//         IF member_user_id != NEW.user_id THEN
//             PERFORM pg_notify(
//                 'message_reaction_' || member_user_id,
//                 reaction_data::text
//             );
//         END IF;
//     END LOOP;
//     CLOSE channel_members_cursor;

//     RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// Need to run these separately?

// -- Create triggers for both insert and delete operations
// CREATE TRIGGER reaction_inserted
// AFTER INSERT ON message_reaction
// FOR EACH ROW
// EXECUTE FUNCTION notify_message_reaction();

// CREATE TRIGGER reaction_deleted
// AFTER DELETE ON message_reaction
// FOR EACH ROW
// EXECUTE FUNCTION notify_message_reaction();

// -- Function for new messages - updated to match exact column names
// CREATE OR REPLACE FUNCTION notify_new_message()
// RETURNS trigger AS $$
// BEGIN
//     PERFORM pg_notify(
//         'new_message',
//         json_build_object(
//             'id', NEW.id,
//             'content', NEW.content,
//             'channelId', NEW.channel_id,  -- note this matches your channelId field
//             'userId', NEW.user_id,        -- matches userId field
//             'createdAt', NEW.created_at   -- matches createdAt field
//         )::text
//     );
//     RETURN NEW;
// END;
// $$ LANGUAGE plpgsql;

// -- Drop and recreate the trigger
// DROP TRIGGER IF EXISTS message_inserted ON message;

// CREATE TRIGGER message_inserted
//     AFTER INSERT ON message
//     FOR EACH ROW
//     EXECUTE FUNCTION notify_new_message();
