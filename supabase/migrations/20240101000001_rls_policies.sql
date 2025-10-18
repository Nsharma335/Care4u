-- RLS Policies

-- Institute Admins Policies
CREATE POLICY "Admins can view own data" ON institute_admins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can update own data" ON institute_admins
  FOR UPDATE USING (auth.uid() = user_id);

-- Candidates Policies
CREATE POLICY "Admins can view candidates in their institute" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM institute_admins 
      WHERE user_id = auth.uid() 
      AND (institute_id = candidates.institute_id OR candidates.institute_id IS NULL)
    )
  );

CREATE POLICY "Admins can insert candidates" ON candidates
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can update candidates" ON candidates
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM institute_admins 
      WHERE user_id = auth.uid() 
      AND (institute_id = candidates.institute_id OR candidates.institute_id IS NULL)
    )
  );

CREATE POLICY "Admins can delete candidates" ON candidates
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM institute_admins 
      WHERE user_id = auth.uid() 
      AND (institute_id = candidates.institute_id OR candidates.institute_id IS NULL)
    )
  );

CREATE POLICY "Family members and caregivers can view assigned candidates" ON candidates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = candidates.id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND candidates.id = ANY(candidate_ids)
    )
  );

-- Family Members Policies
CREATE POLICY "Admins can view family members" ON family_members
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert family members" ON family_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own family member data" ON family_members
  FOR SELECT USING (auth.uid() = user_id);

-- Caregivers Policies
CREATE POLICY "Caregivers can view own data" ON caregivers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all caregivers" ON caregivers
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can insert caregivers" ON caregivers
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

-- Prescriptions Policies
CREATE POLICY "Users can view prescriptions for assigned candidates" ON prescriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = prescriptions.candidate_id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND prescriptions.candidate_id = ANY(candidate_ids)
    )
    OR
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert prescriptions" ON prescriptions
  FOR INSERT WITH CHECK (
    auth.uid() = uploaded_by
  );

-- Medication Schedules Policies
CREATE POLICY "Users can view schedules for assigned candidates" ON medication_schedules
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = medication_schedules.candidate_id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND medication_schedules.candidate_id = ANY(candidate_ids)
    )
    OR
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can insert schedules for assigned candidates" ON medication_schedules
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = medication_schedules.candidate_id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND medication_schedules.candidate_id = ANY(candidate_ids)
    )
  );

CREATE POLICY "Users can update schedules for assigned candidates" ON medication_schedules
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = medication_schedules.candidate_id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND medication_schedules.candidate_id = ANY(candidate_ids)
    )
  );

CREATE POLICY "Users can delete schedules for assigned candidates" ON medication_schedules
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = medication_schedules.candidate_id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND medication_schedules.candidate_id = ANY(candidate_ids)
    )
  );

-- Medication Logs Policies
CREATE POLICY "Users can view logs for assigned candidates" ON medication_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = medication_logs.candidate_id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND medication_logs.candidate_id = ANY(candidate_ids)
    )
    OR
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "System can insert logs" ON medication_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update logs for assigned candidates" ON medication_logs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = medication_logs.candidate_id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND medication_logs.candidate_id = ANY(candidate_ids)
    )
  );

-- Notifications Policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON notifications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Activity Logs Policies
CREATE POLICY "Users can view activity logs for assigned candidates" ON activity_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM family_members WHERE user_id = auth.uid() AND candidate_id = activity_logs.candidate_id
    )
    OR
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid() AND activity_logs.candidate_id = ANY(candidate_ids)
    )
    OR
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

CREATE POLICY "Caregivers can insert activity logs" ON activity_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM caregivers WHERE user_id = auth.uid()
    )
  );

-- Wellness Check-ins Policies
CREATE POLICY "Caregivers can view own wellness check-ins" ON wellness_checkins
  FOR SELECT USING (auth.uid() = caregiver_id);

CREATE POLICY "Caregivers can insert own wellness check-ins" ON wellness_checkins
  FOR INSERT WITH CHECK (auth.uid() = caregiver_id);

CREATE POLICY "Admins can view all wellness check-ins" ON wellness_checkins
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM institute_admins WHERE user_id = auth.uid())
  );

-- Chat Messages Policies
CREATE POLICY "Users can view own chat messages" ON chat_messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages" ON chat_messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

