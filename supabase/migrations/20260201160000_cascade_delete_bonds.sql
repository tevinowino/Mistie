-- Add ON DELETE CASCADE to allow user deletion

-- 1. BONDS TABLE
ALTER TABLE bonds DROP CONSTRAINT IF EXISTS bonds_user_1_id_fkey;
ALTER TABLE bonds DROP CONSTRAINT IF EXISTS bonds_user_2_id_fkey;

ALTER TABLE bonds
    ADD CONSTRAINT bonds_user_1_id_fkey
    FOREIGN KEY (user_1_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

ALTER TABLE bonds
    ADD CONSTRAINT bonds_user_2_id_fkey
    FOREIGN KEY (user_2_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;

-- 2. RELATIONSHIP_ANCHORS TABLE
ALTER TABLE relationship_anchors DROP CONSTRAINT IF EXISTS relationship_anchors_creator_id_fkey;

ALTER TABLE relationship_anchors
    ADD CONSTRAINT relationship_anchors_creator_id_fkey
    FOREIGN KEY (creator_id)
    REFERENCES profiles(id)
    ON DELETE CASCADE;
