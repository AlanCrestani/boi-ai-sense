-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('owner', 'admin', 'manager', 'employee', 'viewer');

-- Create enum for invitation status
CREATE TYPE public.invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Create organizations table
CREATE TABLE public.organizations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  domain TEXT,
  logo_url TEXT,
  subscription_status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  avatar_url TEXT,
  phone TEXT,
  position TEXT,
  department TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'employee',
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

-- Create invitations table
CREATE TABLE public.invitations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role app_role NOT NULL DEFAULT 'employee',
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  invitation_token TEXT NOT NULL UNIQUE,
  status invitation_status DEFAULT 'pending',
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check user role
CREATE OR REPLACE FUNCTION public.has_role_in_org(_user_id UUID, _organization_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.organization_id = _organization_id
      AND ur.role = _role
      AND p.is_active = true
  );
$$;

-- Create function to get user organization
CREATE OR REPLACE FUNCTION public.get_user_organization(_user_id UUID)
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.organization_id
  FROM public.profiles p
  WHERE p.user_id = _user_id
    AND p.is_active = true;
$$;

-- Create function to check if user can manage organization
CREATE OR REPLACE FUNCTION public.can_manage_organization(_user_id UUID, _organization_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    JOIN public.profiles p ON p.user_id = ur.user_id
    WHERE ur.user_id = _user_id
      AND ur.organization_id = _organization_id
      AND ur.role IN ('owner', 'admin')
      AND p.is_active = true
  );
$$;

-- RLS Policies for organizations
CREATE POLICY "Users can view their organization" 
ON public.organizations 
FOR SELECT 
USING (id = public.get_user_organization(auth.uid()));

CREATE POLICY "Owners and admins can update their organization" 
ON public.organizations 
FOR UPDATE 
USING (public.can_manage_organization(auth.uid(), id));

-- RLS Policies for profiles
CREATE POLICY "Users can view profiles in their organization" 
ON public.profiles 
FOR SELECT 
USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (user_id = auth.uid());

CREATE POLICY "Admins can update profiles in their organization" 
ON public.profiles 
FOR UPDATE 
USING (
  organization_id = public.get_user_organization(auth.uid()) 
  AND public.can_manage_organization(auth.uid(), organization_id)
);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

-- RLS Policies for user_roles
CREATE POLICY "Users can view roles in their organization" 
ON public.user_roles 
FOR SELECT 
USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage roles in their organization" 
ON public.user_roles 
FOR ALL 
USING (
  organization_id = public.get_user_organization(auth.uid()) 
  AND public.can_manage_organization(auth.uid(), organization_id)
);

-- RLS Policies for invitations
CREATE POLICY "Users can view invitations in their organization" 
ON public.invitations 
FOR SELECT 
USING (organization_id = public.get_user_organization(auth.uid()));

CREATE POLICY "Admins can manage invitations in their organization" 
ON public.invitations 
FOR ALL 
USING (
  organization_id = public.get_user_organization(auth.uid()) 
  AND public.can_manage_organization(auth.uid(), organization_id)
);

CREATE POLICY "Anyone can view pending invitations by token" 
ON public.invitations 
FOR SELECT 
USING (status = 'pending' AND expires_at > now());

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  invitation_record RECORD;
  org_id UUID;
BEGIN
  -- Check if user was invited
  SELECT * INTO invitation_record
  FROM public.invitations
  WHERE email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  ORDER BY created_at DESC
  LIMIT 1;

  IF invitation_record IS NOT NULL THEN
    -- User was invited, join existing organization
    org_id := invitation_record.organization_id;
    
    -- Create profile
    INSERT INTO public.profiles (
      user_id, 
      organization_id, 
      full_name, 
      email
    ) VALUES (
      NEW.id, 
      org_id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
      NEW.email
    );
    
    -- Assign role
    INSERT INTO public.user_roles (
      user_id, 
      organization_id, 
      role, 
      granted_by
    ) VALUES (
      NEW.id, 
      org_id, 
      invitation_record.role, 
      invitation_record.invited_by
    );
    
    -- Mark invitation as accepted
    UPDATE public.invitations 
    SET status = 'accepted', accepted_at = now()
    WHERE id = invitation_record.id;
  ELSE
    -- New organization owner
    -- Create organization
    INSERT INTO public.organizations (name, slug) 
    VALUES (
      COALESCE(NEW.raw_user_meta_data->>'company_name', 'Minha Empresa'),
      lower(replace(COALESCE(NEW.raw_user_meta_data->>'company_name', NEW.email), ' ', '-'))
    ) RETURNING id INTO org_id;
    
    -- Create profile
    INSERT INTO public.profiles (
      user_id, 
      organization_id, 
      full_name, 
      email
    ) VALUES (
      NEW.id, 
      org_id, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
      NEW.email
    );
    
    -- Assign owner role
    INSERT INTO public.user_roles (
      user_id, 
      organization_id, 
      role
    ) VALUES (
      NEW.id, 
      org_id, 
      'owner'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();